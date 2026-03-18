// ============================================================
// API Route: /api/checkout
// PATTERNS: Idempotency, inventory reservation, payment retry,
//           transaction-like operations with rollback
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  cartStore,
  orderStore,
  inventoryManager,
  idempotencyStore,
  generateId,
} from "@/lib/store";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCode,
  type Order,
  type CheckoutInput,
  type PaymentResult,
  type ApiResponse,
  isPaymentSuccess,
} from "@/types";

// ============================================================
// PAYMENT PROCESSING — With Retry & Exponential Backoff
// ============================================================
// PATTERN: Retry with exponential backoff
// Some payment failures are transient (network blip, rate limit).
// We retry a few times with increasing delays before giving up.
// Delay formula: baseDelay * 2^attempt (100ms, 200ms, 400ms)

const MAX_PAYMENT_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 100;

async function processPaymentWithRetry(
  amount: number,
  token: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<PaymentResult> {
  for (let attempt = 0; attempt < MAX_PAYMENT_RETRIES; attempt++) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Simulate ~20% failure rate on each attempt
    // With 3 retries, overall failure rate is ~0.8% (0.2^3)
    if (Math.random() < 0.2) {
      // On last attempt, return the failure
      if (attempt === MAX_PAYMENT_RETRIES - 1) {
        return {
          success: false,
          error: "Card declined after multiple attempts",
          code: "card_declined",
        };
      }
      // Otherwise, wait with exponential backoff and retry
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    // Payment succeeded
    return {
      success: true,
      transactionId: generateId("txn"),
      amount,
    };
  }

  // Should not reach here, but TypeScript needs it
  return {
    success: false,
    error: "Payment processing failed",
    code: "network_error",
  };
}

// ============================================================
// POST /api/checkout — Full checkout flow
// ============================================================
// The checkout follows a "saga" pattern:
// 1. Validate inputs
// 2. Check idempotency (prevent double-charge)
// 3. Reserve inventory (prevent overselling)
// 4. Process payment (with retry)
// 5. If payment fails → release inventory (rollback)
// 6. If payment succeeds → create order, clear cart

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Order>>> {
  try {
    const body = (await request.json()) as CheckoutInput;

    // ---- Step 0: Check idempotency key ----
    // PATTERN: The client sends a unique key (usually a UUID) with each
    // checkout request. If we've already processed this key, return the
    // cached order instead of charging again.
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const existingOrder = idempotencyStore.get(idempotencyKey);
      if (existingOrder) {
        // Already processed — return the same order (no double charge)
        return NextResponse.json(createSuccessResponse(existingOrder), {
          status: 200,
        });
      }
    }

    // ---- Step 1: Validate cart exists and has items ----
    const cart = cartStore.getById(body.cartId);
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        createErrorResponse("Cart is empty or not found", ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    // ---- Step 2: Validate shipping address ----
    const { shippingAddress } = body;
    const addressErrors: Record<string, string[]> = {};
    if (!shippingAddress.firstName?.trim())
      addressErrors.firstName = ["First name is required"];
    if (!shippingAddress.lastName?.trim())
      addressErrors.lastName = ["Last name is required"];
    if (!shippingAddress.line1?.trim())
      addressErrors.line1 = ["Address is required"];
    if (!shippingAddress.city?.trim())
      addressErrors.city = ["City is required"];
    if (!shippingAddress.state?.trim())
      addressErrors.state = ["State is required"];
    if (!shippingAddress.postalCode?.trim())
      addressErrors.postalCode = ["Postal code is required"];

    if (Object.keys(addressErrors).length > 0) {
      return NextResponse.json(
        createErrorResponse(
          "Invalid shipping address",
          ErrorCode.VALIDATION_ERROR,
          addressErrors
        ),
        { status: 400 }
      );
    }

    // ---- Step 3: Reserve inventory ----
    // PATTERN: Reserve BEFORE payment to prevent overselling.
    // If two users check out the last item at the same time,
    // the second reservation will fail.
    const reservationItems = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    const reservationResult = inventoryManager.reserve(reservationItems);
    if (!reservationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Out of stock: ${reservationResult.failedItem}`,
          ErrorCode.OUT_OF_STOCK
        ),
        { status: 409 } // 409 Conflict — resource state conflict
      );
    }

    // ---- Step 4: Process payment (with retry) ----
    const paymentResult = await processPaymentWithRetry(
      cart.totals.total,
      body.payment.token
    );

    // PATTERN: If payment fails, RELEASE the reserved inventory (rollback)
    if (!isPaymentSuccess(paymentResult)) {
      inventoryManager.release(reservationItems);
      return NextResponse.json(
        createErrorResponse(paymentResult.error, ErrorCode.PAYMENT_FAILED),
        { status: 402 }
      );
    }

    // ---- Step 5: Create order ----
    const now = new Date().toISOString();
    const order: Order = {
      id: generateId("ord"),
      status: "paid",
      items: cart.items,
      totals: cart.totals,
      shippingAddress: body.shippingAddress,
      payment: {
        method: "credit_card" as const,
        last4: "4242",
        brand: "visa",
        expiryMonth: 12,
        expiryYear: 2027,
      },
      customerEmail: body.customerEmail,
      notes: body.notes,
      createdAt: now,
      updatedAt: now,
    };

    orderStore.create(order);

    // ---- Step 6: Cache idempotency key ----
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, order);
    }

    // ---- Step 7: Clear the cart ----
    cartStore.delete(cart.id);

    return NextResponse.json(createSuccessResponse(order), { status: 201 });
  } catch {
    return NextResponse.json(
      createErrorResponse("Checkout failed", ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
