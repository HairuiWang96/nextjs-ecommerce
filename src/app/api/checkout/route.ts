// ============================================================
// API Route: /api/checkout
// PATTERNS: Complex business logic, transaction-like operations
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { cartStore, orderStore, generateId } from '@/lib/store';
import { createSuccessResponse, createErrorResponse, ErrorCode, type Order, type CheckoutInput, type PaymentResult, type ApiResponse, isPaymentSuccess } from '@/types';

// PATTERN: Mock async operation simulating payment processing
// In production, this would call Stripe, PayPal, etc.
async function processPayment(
    amount: number,
    _token: string, // kept for API signature — would be used with real payment provider
): Promise<PaymentResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate occasional failures (disabled for demo — uncomment to test error handling)
    // if (Math.random() < 0.1) {
    //   return {
    //     success: false,
    //     error: "Card declined by issuer",
    //     code: "card_declined",
    //   };
    // }

    return {
        success: true,
        transactionId: generateId('txn'),
        amount,
    };
}

// POST /api/checkout — process checkout
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Order>>> {
    try {
        const body = (await request.json()) as CheckoutInput;

        // 1. Validate cart exists and has items
        const cart = cartStore.getById(body.cartId);
        if (!cart || cart.items.length === 0) {
            return NextResponse.json(createErrorResponse('Cart is empty or not found', ErrorCode.BAD_REQUEST), { status: 400 });
        }

        // 2. Validate shipping address
        const { shippingAddress } = body;
        const addressErrors: Record<string, string[]> = {};
        if (!shippingAddress.firstName?.trim()) addressErrors.firstName = ['First name is required'];
        if (!shippingAddress.lastName?.trim()) addressErrors.lastName = ['Last name is required'];
        if (!shippingAddress.line1?.trim()) addressErrors.line1 = ['Address is required'];
        if (!shippingAddress.city?.trim()) addressErrors.city = ['City is required'];
        if (!shippingAddress.state?.trim()) addressErrors.state = ['State is required'];
        if (!shippingAddress.postalCode?.trim()) addressErrors.postalCode = ['Postal code is required'];

        if (Object.keys(addressErrors).length > 0) {
            return NextResponse.json(createErrorResponse('Invalid shipping address', ErrorCode.VALIDATION_ERROR, addressErrors), { status: 400 });
        }

        // 3. Process payment
        const paymentResult = await processPayment(cart.totals.total, body.payment.token);

        // PATTERN: Using a type guard to narrow the discriminated union
        if (!isPaymentSuccess(paymentResult)) {
            return NextResponse.json(createErrorResponse(paymentResult.error, ErrorCode.PAYMENT_FAILED), { status: 402 });
        }

        // 4. Create order
        const now = new Date().toISOString();
        const order: Order = {
            id: generateId('ord'),
            status: 'paid',
            items: cart.items,
            totals: cart.totals,
            shippingAddress: body.shippingAddress,
            // PATTERN: Since PaymentInfo is a discriminated union, we need to
            // construct the correct variant. Here we always mock a credit card.
            payment: {
                method: 'credit_card' as const,
                last4: '4242',
                brand: 'visa',
                expiryMonth: 12,
                expiryYear: 2027,
            },
            customerEmail: body.customerEmail,
            notes: body.notes,
            createdAt: now,
            updatedAt: now,
        };

        orderStore.create(order);

        // 5. Clear the cart
        cartStore.delete(cart.id);

        return NextResponse.json(createSuccessResponse(order), { status: 201 });
    } catch {
        return NextResponse.json(createErrorResponse('Checkout failed', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
}

// After a successful checkout, the cart is deleted because the cart's items have been converted into an order (step 4, line 107-127). Keeping the cart around would mean:
// Stale data — the user could accidentally check out the same items again, creating duplicate orders.
// Confusing UX — the cart would still show items that have already been purchased.
// Wasted storage — the cart is no longer needed once an order record exists.
// It's standard e-commerce practice: cart is a temporary holding area, and once payment succeeds and an order is created, the cart has served its purpose and should be cleared so the user starts fresh.
