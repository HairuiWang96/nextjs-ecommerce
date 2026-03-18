// ============================================================
// Custom Hook: useCheckout
// PATTERNS: State machine, reducer pattern, form state management
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiSuccess, type Order, type ShippingAddress } from "@/types";

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

// PATTERN: Hook return type
interface UseCheckoutReturn {
  step: CheckoutStep;
  formData: CheckoutFormData;
  order: Order | null;
  error: string | null;
  updateFormData: (updates: Partial<CheckoutFormData>) => void;
  updateShippingAddress: (updates: Partial<ShippingAddress>) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitOrder: (cartId: string) => Promise<void>;
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
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PATTERN: Partial updates — merge new values with existing state
  const updateFormData = useCallback((updates: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // PATTERN: Nested partial updates for shipping address
  const updateShippingAddress = useCallback(
    (updates: Partial<ShippingAddress>) => {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: { ...prev.shippingAddress, ...updates },
      }));
    },
    []
  );

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

  const submitOrder = useCallback(
    async (cartId: string) => {
      setStep("processing");
      setError(null);

      const response = await apiClient.post<Order>("/checkout", {
        cartId,
        shippingAddress: formData.shippingAddress,
        payment: {
          method: formData.paymentMethod,
          token: formData.paymentToken,
        },
        customerEmail: formData.customerEmail,
        notes: formData.notes || undefined,
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

  const reset = useCallback(() => {
    setStep("shipping");
    setFormData(INITIAL_FORM_DATA);
    setOrder(null);
    setError(null);
  }, []);

  return {
    step,
    formData,
    order,
    error,
    updateFormData,
    updateShippingAddress,
    nextStep,
    prevStep,
    submitOrder,
    reset,
  };
}
