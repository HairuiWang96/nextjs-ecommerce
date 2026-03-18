// ============================================================
// API Route: /api/cart
// PATTERNS: Stateful operations, business logic in API routes
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { cartStore, productStore } from "@/lib/store";
import {
  createSuccessResponse,
  createErrorResponse,
  computeCartTotals,
  ErrorCode,
  type Cart,
  type CartItem,
  type AddToCartInput,
  type UpdateCartItemInput,
  type ApiResponse,
} from "@/types";

// We use a single cart for simplicity (in production: session-based or user-based)
const DEFAULT_CART_ID = "cart_default";

function getOrCreateCart(): Cart {
  let cart = cartStore.getById(DEFAULT_CART_ID);
  if (!cart) {
    cart = {
      id: DEFAULT_CART_ID,
      items: [],
      totals: computeCartTotals([]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cartStore.save(cart);
  }
  return cart;
}

// GET /api/cart — get current cart
export async function GET(): Promise<NextResponse<ApiResponse<Cart>>> {
  const cart = getOrCreateCart();
  return NextResponse.json(createSuccessResponse(cart));
}

// POST /api/cart — add item to cart
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Cart>>> {
  try {
    const body = (await request.json()) as AddToCartInput;

    // Validate product and variant exist
    const product = productStore.getById(body.productId);
    if (!product) {
      return NextResponse.json(
        createErrorResponse("Product not found", ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    const variant = product.variants.find((v) => v.id === body.variantId);
    if (!variant) {
      return NextResponse.json(
        createErrorResponse("Variant not found", ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    // Check inventory
    if (variant.inventory < body.quantity) {
      return NextResponse.json(
        createErrorResponse(
          `Only ${variant.inventory} items in stock`,
          ErrorCode.OUT_OF_STOCK
        ),
        { status: 400 }
      );
    }

    const cart = getOrCreateCart();

    // Check if item already exists in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId === body.productId && item.variantId === body.variantId
    );

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += body.quantity;
    } else {
      // Add new item with denormalized product data
      const newItem: CartItem = {
        productId: body.productId,
        variantId: body.variantId,
        quantity: body.quantity,
        product: {
          id: product.id,
          title: product.title,
          images: product.images,
        },
        variant: {
          id: variant.id,
          name: variant.name,
          price: variant.price,
          sku: variant.sku,
        },
      };
      cart.items.push(newItem);
    }

    // Recompute totals
    cart.totals = computeCartTotals(cart.items);
    cart.updatedAt = new Date().toISOString();
    cartStore.save(cart);

    return NextResponse.json(createSuccessResponse(cart));
  } catch {
    return NextResponse.json(
      createErrorResponse("Invalid request body", ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
}

// PUT /api/cart — update item quantity (0 = remove)
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Cart>>> {
  try {
    const body = (await request.json()) as UpdateCartItemInput;
    const cart = getOrCreateCart();

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId === body.productId && item.variantId === body.variantId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        createErrorResponse("Item not in cart", ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    if (body.quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = body.quantity;
    }

    cart.totals = computeCartTotals(cart.items);
    cart.updatedAt = new Date().toISOString();
    cartStore.save(cart);

    return NextResponse.json(createSuccessResponse(cart));
  } catch {
    return NextResponse.json(
      createErrorResponse("Invalid request body", ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
}
