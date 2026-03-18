// ============================================================
// Cart Component
// PATTERNS: Context consumer, derived state, promo code UI
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, pluralize } from "@/lib/formatters";

export function CartView() {
  const {
    cart,
    loading,
    error,
    updateItemQuantity,
    removeItem,
    applyPromoCode,
    removePromoCode,
    clearError,
  } = useCart();

  // PATTERN: Local state for the promo code input (not global — only needed here)
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoSuccess(false);
    clearError();

    const success = await applyPromoCode(promoInput.trim());
    if (success) {
      setPromoSuccess(true);
      setPromoInput("");
    }
    setPromoLoading(false);
  };

  const handleRemovePromo = async () => {
    await removePromoCode();
    setPromoSuccess(false);
  };

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

      {/* Promo Code Section */}
      <div className="border rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-3">Promo Code</h3>
        {cart.couponCode ? (
          // Applied promo code display
          <div className="flex items-center justify-between bg-green-50 rounded p-3">
            <div>
              <span className="text-green-700 font-medium">{cart.couponCode}</span>
              <span className="text-green-600 text-sm ml-2">Applied!</span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          // Promo code input
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
              placeholder="Enter promo code (e.g., SAVE10)"
              className="flex-1 border rounded px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="bg-gray-800 text-white rounded px-4 py-2 text-sm font-medium
                         hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              {promoLoading ? "Applying..." : "Apply"}
            </button>
          </div>
        )}
        {promoSuccess && !cart.couponCode && (
          <p className="text-green-600 text-xs mt-2">Promo code applied!</p>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Try: SAVE10, SAVE20, FLAT5, FREESHIP
        </p>
      </div>

      {/* Cart Totals */}
      <div className="border-t pt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(cart.totals.subtotal)}</span>
        </div>
        {cart.totals.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount {cart.couponCode && `(${cart.couponCode})`}</span>
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
