// ============================================================
// TYPESCRIPT PATTERNS: Discriminated Unions, Type Guards, Mapped Types
// ============================================================

import type { CartItem, CartTotals } from "./cart";

// PATTERN: Const object for order statuses (same pattern as ProductStatus)
export const OrderStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  PAID: "paid",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// PATTERN: Interface for structured address data
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// PATTERN: Discriminated union for payment methods
// Each variant has `method` as discriminant + method-specific fields
export type PaymentInfo =
  | {
      method: "credit_card";
      last4: string;
      brand: string; // "visa", "mastercard", etc.
      expiryMonth: number;
      expiryYear: number;
    }
  | {
      method: "paypal";
      email: string;
    }
  | {
      method: "bank_transfer";
      bankName: string;
      accountLast4: string;
    };

// PATTERN: Complex interface combining multiple types
export interface Order {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  totals: CartTotals;
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
  customerEmail: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// PATTERN: Discriminated union for payment processing results
// Success and failure have completely different shapes
export type PaymentResult =
  | {
      success: true;
      transactionId: string;
      amount: number;
    }
  | {
      success: false;
      error: string;
      code: "insufficient_funds" | "card_declined" | "network_error" | "invalid_card";
    };

// PATTERN: Type guard for discriminated union
// After this check, TS knows which branch of PaymentResult you have
export function isPaymentSuccess(
  result: PaymentResult
): result is Extract<PaymentResult, { success: true }> {
  return result.success === true;
}

// PATTERN: Input type for creating an order from checkout
export interface CheckoutInput {
  cartId: string;
  shippingAddress: ShippingAddress;
  payment: {
    method: PaymentInfo["method"]; // PATTERN: Indexed access type — extracts "credit_card" | "paypal" | "bank_transfer"
    // In a real app, you'd send a payment token, not raw card data
    token: string;
  };
  customerEmail: string;
  notes?: string;
}

// PATTERN: Order summary for list views
export type OrderSummary = Pick<
  Order,
  "id" | "status" | "customerEmail" | "createdAt"
> & {
  total: number;
  itemCount: number;
};

// PATTERN: Mapper function (same pattern as toProductSummary)
export function toOrderSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    status: order.status,
    customerEmail: order.customerEmail,
    createdAt: order.createdAt,
    total: order.totals.total,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
