// ============================================================
// TYPESCRIPT PATTERNS: Generics, Utility Types, Computed Types
// ============================================================

import type { Product, ProductVariant } from './product';

// PATTERN: Interface referencing other interfaces
// CartItem links a product + specific variant with a quantity
export interface CartItem {
    productId: string;
    variantId: string;
    quantity: number;
    // Denormalized data — stored for display without re-fetching
    product: Pick<Product, 'id' | 'title' | 'images'>;
    variant: Pick<ProductVariant, 'id' | 'name' | 'price' | 'sku'>;
}

// PATTERN: Readonly — prevents accidental mutation
//! Cart totals should be computed, not mutated directly
export interface CartTotals {
    readonly subtotal: number; // sum of (price * qty) in cents
    readonly discount: number; // discount amount in cents
    readonly tax: number; // tax amount in cents
    readonly total: number; // final total in cents
    readonly itemCount: number; // total number of items
}

export interface Cart {
    id: string;
    items: CartItem[];
    totals: CartTotals;
    couponCode?: string;
    createdAt: string;
    updatedAt: string;
}

// PATTERN: Discriminated union for discount types
// The `type` field is the "discriminant" — TS uses it to narrow
// which specific shape you're working with in a switch/if.
export type Discount =
    | { type: 'percentage'; value: number } // e.g., 10 = 10% off
    | { type: 'fixed'; value: number } // e.g., 500 = $5.00 off
    | { type: 'free_shipping' }; // no value needed

// PATTERN: Function using discriminated union
// TS narrows `discount` inside each case — try hovering in your IDE!
export function calculateDiscount(subtotal: number, discount: Discount): number {
    switch (discount.type) {
        case 'percentage':
            return Math.round(subtotal * (discount.value / 100));
        case 'fixed':
            return Math.min(discount.value, subtotal); //! can't discount more than subtotal
        case 'free_shipping':
            return 0; // handled separately in shipping calculation
    }
}

// PATTERN: Pure function to compute cart totals
// Takes items and optional discount, returns a readonly totals object
const TAX_RATE = 0.08; // 8% tax

export function computeCartTotals(items: CartItem[], discount?: Discount): CartTotals {
    const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
    const discountAmount = discount ? calculateDiscount(subtotal, discount) : 0;
    const taxableAmount = subtotal - discountAmount;
    const tax = Math.round(taxableAmount * TAX_RATE);
    const total = taxableAmount + tax;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, discount: discountAmount, tax, total, itemCount };
}

// PATTERN: Input types for API operations
// Only send what's needed — not the full CartItem with denormalized data
export interface AddToCartInput {
    productId: string;
    variantId: string;
    quantity: number;
}

export interface UpdateCartItemInput {
    productId: string;
    variantId: string;
    quantity: number; // 0 = remove
}
