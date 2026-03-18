// ============================================================
// Custom Hook: useCheckout
// PATTERNS: State machine, field-level validation, idempotency,
//           failure recovery with retry
// ============================================================

"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiSuccess, type Order, type ShippingAddress } from "@/types";
import { isValidEmail, isValidPostalCode } from "@/lib/validators";

// PATTERN: Const object for checkout steps (state machine states)
export const CheckoutStep = {
  SHIPPING: "shipping",
  PAYMENT: "payment",
  REVIEW: "review",
  PROCESSING: "processing",
  COMPLETE: "complete",
  ERROR: "error",
} as const;

export type CheckoutStep = (typeof CheckoutStep)[keyof typeof CheckoutStep];

// PATTERN: Interface for all checkout form data
interface CheckoutFormData {
  shippingAddress: ShippingAddress;
  customerEmail: string;
  notes: string;
  paymentToken: string;
  paymentMethod: "credit_card" | "paypal" | "bank_transfer";
}

// PATTERN: Field-level errors as a Record
// Keys are field names, values are error messages (empty string = no error)
type FormErrors = Record<string, string>;

// PATTERN: Hook return type — documents the full public API
interface UseCheckoutReturn {
  step: CheckoutStep;
  formData: CheckoutFormData;
  errors: FormErrors;
  order: Order | null;
  error: string | null;
  attemptCount: number;
  updateFormData: (updates: Partial<CheckoutFormData>) => void;
  updateShippingAddress: (updates: Partial<ShippingAddress>) => void;
  validateField: (field: string) => void;
  validateShippingForm: () => boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: CheckoutStep) => void;
  submitOrder: (cartId: string) => Promise<void>;
  retryOrder: (cartId: string) => Promise<void>;
  reset: () => void;
}

// PATTERN: Initial state as a const — reusable for reset
const INITIAL_FORM_DATA: CheckoutFormData = {
  shippingAddress: {
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  },
  customerEmail: "",
  notes: "",
  paymentToken: "tok_mock_visa_4242", // mock token for demo
  paymentMethod: "credit_card",
};

const STEP_ORDER: CheckoutStep[] = ["shipping", "payment", "review"];

export function useCheckout(): UseCheckoutReturn {
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // PATTERN: useRef for the idempotency key — persists across renders
  // without causing re-renders (unlike useState)
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // ============================================================
  // FIELD-LEVEL VALIDATION
  // ============================================================
  // PATTERN: Validate a single field on blur — gives immediate feedback
  // without waiting for form submission. Returns the error message.
  const validateField = useCallback(
    (field: string) => {
      let errorMsg = "";
      const addr = formData.shippingAddress;

      switch (field) {
        case "firstName":
          if (!addr.firstName.trim()) errorMsg = "First name is required";
          break;
        case "lastName":
          if (!addr.lastName.trim()) errorMsg = "Last name is required";
          break;
        case "email":
          if (!formData.customerEmail.trim()) errorMsg = "Email is required";
          else if (!isValidEmail(formData.customerEmail))
            errorMsg = "Enter a valid email address";
          break;
        case "line1":
          if (!addr.line1.trim()) errorMsg = "Address is required";
          break;
        case "city":
          if (!addr.city.trim()) errorMsg = "City is required";
          break;
        case "state":
          if (!addr.state.trim()) errorMsg = "State is required";
          break;
        case "postalCode":
          if (!addr.postalCode.trim()) errorMsg = "Zip code is required";
          else if (!isValidPostalCode(addr.postalCode))
            errorMsg = "Enter a valid US zip code (e.g., 12345)";
          break;
      }

      setErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) {
          next[field] = errorMsg;
        } else {
          delete next[field];
        }
        return next;
      });
    },
    [formData]
  );

  // PATTERN: Validate all shipping fields at once — used before advancing step
  const validateShippingForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const addr = formData.shippingAddress;

    if (!addr.firstName.trim()) newErrors.firstName = "First name is required";
    if (!addr.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.customerEmail.trim())
      newErrors.email = "Email is required";
    else if (!isValidEmail(formData.customerEmail))
      newErrors.email = "Enter a valid email address";
    if (!addr.line1.trim()) newErrors.line1 = "Address is required";
    if (!addr.city.trim()) newErrors.city = "City is required";
    if (!addr.state.trim()) newErrors.state = "State is required";
    if (!addr.postalCode.trim())
      newErrors.postalCode = "Zip code is required";
    else if (!isValidPostalCode(addr.postalCode))
      newErrors.postalCode = "Enter a valid US zip code";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ============================================================
  // FORM DATA UPDATES
  // ============================================================
  const updateFormData = useCallback((updates: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateShippingAddress = useCallback(
    (updates: Partial<ShippingAddress>) => {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: { ...prev.shippingAddress, ...updates },
      }));
    },
    []
  );

  // ============================================================
  // STEP NAVIGATION
  // ============================================================
  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
    if (currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step]);

  const goToStep = useCallback((newStep: CheckoutStep) => {
    setStep(newStep);
  }, []);

  // ============================================================
  // ORDER SUBMISSION — With Idempotency Key
  // ============================================================
  // PATTERN: The idempotency key is sent as a header. If the user
  // double-clicks or retries, the server returns the same order
  // instead of charging them again.
  const submitOrder = useCallback(
    async (cartId: string) => {
      setStep("processing");
      setError(null);
      setAttemptCount((prev) => prev + 1);

      const response = await apiClient.post<Order>("/checkout", {
        cartId,
        shippingAddress: formData.shippingAddress,
        payment: {
          method: formData.paymentMethod,
          token: formData.paymentToken,
        },
        customerEmail: formData.customerEmail,
        notes: formData.notes || undefined,
      }, {
        headers: {
          "Idempotency-Key": idempotencyKeyRef.current,
        },
      });

      if (isApiSuccess(response)) {
        setOrder(response.data);
        setStep("complete");
      } else {
        setError(response.error.message);
        setStep("error");
      }
    },
    [formData]
  );

  // PATTERN: Retry with a NEW idempotency key
  // The previous attempt failed, so we generate a new key for the retry.
  // (The old key might be cached as "in progress" on the server.)
  const retryOrder = useCallback(
    async (cartId: string) => {
      idempotencyKeyRef.current = crypto.randomUUID();
      await submitOrder(cartId);
    },
    [submitOrder]
  );

  const reset = useCallback(() => {
    setStep("shipping");
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setOrder(null);
    setError(null);
    setAttemptCount(0);
    idempotencyKeyRef.current = crypto.randomUUID();
  }, []);

  return {
    step,
    formData,
    errors,
    order,
    error,
    attemptCount,
    updateFormData,
    updateShippingAddress,
    validateField,
    validateShippingForm,
    nextStep,
    prevStep,
    goToStep,
    submitOrder,
    retryOrder,
    reset,
  };
}
