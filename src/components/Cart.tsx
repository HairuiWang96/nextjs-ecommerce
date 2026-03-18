// ============================================================
// Cart Component
// PATTERNS: Context consumer, derived state, optimistic UI
// ============================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/formatters";
import { pluralize } from "@/lib/formatters";

export function CartView() {
  const { cart, loading, error, updateItemQuantity, removeItem } = useCart();

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Link href="/" className="text-blue-600 underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Shopping Cart ({pluralize(cart.totals.itemCount, "item")})
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {cart.items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex items-center gap-4 border rounded-lg p-4"
          >
            {/* Product image */}
            <div className="rounded w-20 h-20 flex-shrink-0 overflow-hidden relative">
              {item.product.images[0] ? (
                <Image
                  src={item.product.images[0]}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-xs text-center">
                    {item.product.title}
                  </span>
                </div>
              )}
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{item.product.title}</h3>
              <p className="text-sm text-gray-500">{item.variant.name}</p>
              <p className="text-sm font-medium text-blue-600">
                {formatCurrency(item.variant.price)}
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateItemQuantity(
                    item.productId,
                    item.variantId,
                    item.quantity - 1
                  )
                }
                disabled={item.quantity <= 1}
                className="w-8 h-8 border rounded flex items-center justify-center
                           hover:bg-gray-50 disabled:opacity-50"
              >
                -
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() =>
                  updateItemQuantity(
                    item.productId,
                    item.variantId,
                    item.quantity + 1
                  )
                }
                className="w-8 h-8 border rounded flex items-center justify-center
                           hover:bg-gray-50"
              >
                +
              </button>
            </div>

            {/* Line total */}
            <div className="text-right w-24">
              <p className="font-medium">
                {formatCurrency(item.variant.price * item.quantity)}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Cart Totals */}
      <div className="border-t pt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(cart.totals.subtotal)}</span>
        </div>
        {cart.totals.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(cart.totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>{formatCurrency(cart.totals.tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(cart.totals.total)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="mt-6">
        <Link
          href="/checkout"
          className="block w-full bg-blue-600 text-white text-center rounded-lg py-3 font-medium
                     hover:bg-blue-700 transition-colors"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
