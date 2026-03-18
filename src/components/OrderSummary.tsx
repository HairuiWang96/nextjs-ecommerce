// ============================================================
// OrderSummary / OrderConfirmation Component
// PATTERNS: Typed props, conditional rendering, readonly display
// ============================================================

"use client";

import Link from "next/link";
import type { Order } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

// PATTERN: Props with callback function
interface OrderConfirmationProps {
  order: Order;
  onContinueShopping: () => void;
}

export function OrderConfirmation({
  order,
  onContinueShopping,
}: OrderConfirmationProps) {
  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success Header */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Order Confirmed!</h2>
        <p className="text-gray-600 mt-1">
          Order #{order.id} placed on {formatDateTime(order.createdAt)}
        </p>
      </div>

      {/* Order Details */}
      <div className="border rounded-lg p-6 text-left mb-6">
        <h3 className="font-medium mb-3">Order Details</h3>

        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex justify-between text-sm py-2 border-b last:border-0"
          >
            <div>
              <p className="font-medium">{item.product.title}</p>
              <p className="text-gray-500">
                {item.variant.name} x {item.quantity}
              </p>
            </div>
            <p className="font-medium">
              {formatCurrency(item.variant.price * item.quantity)}
            </p>
          </div>
        ))}

        <div className="mt-4 pt-2 border-t space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(order.totals.subtotal)}</span>
          </div>
          {order.totals.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{formatCurrency(order.totals.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Total</span>
            <span>{formatCurrency(order.totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="border rounded-lg p-6 text-left mb-6">
        <h3 className="font-medium mb-2">Shipping To</h3>
        <p className="text-sm text-gray-600">
          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          <br />
          {order.shippingAddress.line1}
          <br />
          {order.shippingAddress.line2 && (
            <>
              {order.shippingAddress.line2}
              <br />
            </>
          )}
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.postalCode}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Link
          href="/"
          onClick={onContinueShopping}
          className="bg-blue-600 text-white rounded px-6 py-2 font-medium
                     hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
