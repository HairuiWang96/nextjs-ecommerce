// ============================================================
// API Route: /api/cart/promo
// PATTERNS: Promo code validation, dynamic pricing
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { cartStore, promoCodeStore } from "@/lib/store";
import {
  createSuccessResponse,
  createErrorResponse,
  computeCartTotals,
  ErrorCode,
  type Cart,
  type ApiResponse,
} from "@/types";

const DEFAULT_CART_ID = "cart_default";

// POST /api/cart/promo — Apply a promo code
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Cart>>> {
  try {
    const { code } = (await request.json()) as { code: string };

    if (!code?.trim()) {
      return NextResponse.json(
        createErrorResponse("Promo code is required", ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const cart = cartStore.getById(DEFAULT_CART_ID);
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        createErrorResponse("Cart is empty", ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    // Validate the promo code
    const discount = promoCodeStore.validate(code);
    if (!discount) {
      return NextResponse.json(
        createErrorResponse(
          `Invalid promo code: "${code}"`,
          ErrorCode.VALIDATION_ERROR
        ),
        { status: 400 }
      );
    }

    // Apply the promo code and recompute totals
    cart.couponCode = code.toUpperCase();
    cart.totals = computeCartTotals(cart.items, discount);
    cart.updatedAt = new Date().toISOString();
    cartStore.save(cart);

    return NextResponse.json(createSuccessResponse(cart));
  } catch {
    return NextResponse.json(
      createErrorResponse("Invalid request", ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
}

// DELETE /api/cart/promo — Remove promo code
export async function DELETE(): Promise<NextResponse<ApiResponse<Cart>>> {
  const cart = cartStore.getById(DEFAULT_CART_ID);
  if (!cart) {
    return NextResponse.json(
      createErrorResponse("Cart not found", ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  // Remove promo and recompute totals without discount
  cart.couponCode = undefined;
  cart.totals = computeCartTotals(cart.items);
  cart.updatedAt = new Date().toISOString();
  cartStore.save(cart);

  return NextResponse.json(createSuccessResponse(cart));
}
