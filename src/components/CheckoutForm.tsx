// ============================================================
// CheckoutForm Component
// PATTERNS: Multi-step form, controlled inputs, form validation
// ============================================================

"use client";

import { useCheckout, CheckoutStep } from "@/hooks/useCheckout";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/formatters";
import { isValidEmail, isValidPostalCode } from "@/lib/validators";
import { OrderConfirmation } from "./OrderSummary";

export function CheckoutForm() {
  const {
    step,
    formData,
    order,
    error,
    updateShippingAddress,
    updateFormData,
    nextStep,
    prevStep,
    submitOrder,
    reset,
  } = useCheckout();

  const { cart, refetch } = useCart();

  // PATTERN: Form submission handler
  const handleSubmitOrder = async () => {
    if (!cart) return;
    await submitOrder(cart.id);
    await refetch(); // refresh cart (should be empty after checkout)
  };

  // PATTERN: Step-based rendering with switch
  // Each step is a self-contained section of the form
  switch (step) {
    case CheckoutStep.SHIPPING:
      return (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.shippingAddress.firstName}
                  onChange={(e) =>
                    updateShippingAddress({ firstName: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.shippingAddress.lastName}
                  onChange={(e) =>
                    updateShippingAddress({ lastName: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  updateFormData({ customerEmail: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.customerEmail &&
                !isValidEmail(formData.customerEmail) && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter a valid email
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.shippingAddress.line1}
                onChange={(e) =>
                  updateShippingAddress({ line1: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.shippingAddress.line2 || ""}
                onChange={(e) =>
                  updateShippingAddress({ line2: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={formData.shippingAddress.city}
                  onChange={(e) =>
                    updateShippingAddress({ city: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.shippingAddress.state}
                  onChange={(e) =>
                    updateShippingAddress({ state: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Zip Code *
                </label>
                <input
                  type="text"
                  value={formData.shippingAddress.postalCode}
                  onChange={(e) =>
                    updateShippingAddress({ postalCode: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.shippingAddress.postalCode &&
                  !isValidPostalCode(formData.shippingAddress.postalCode) && (
                    <p className="text-red-500 text-xs mt-1">
                      Enter a valid US zip code
                    </p>
                  )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Order Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={nextStep}
              disabled={
                !formData.shippingAddress.firstName ||
                !formData.shippingAddress.lastName ||
                !formData.shippingAddress.line1 ||
                !formData.shippingAddress.city ||
                !formData.shippingAddress.state ||
                !formData.shippingAddress.postalCode ||
                !formData.customerEmail ||
                !isValidEmail(formData.customerEmail)
              }
              className="bg-blue-600 text-white rounded px-6 py-2 font-medium
                         hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      );

    case CheckoutStep.PAYMENT:
      return (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6">Payment</h2>

          {/* Mock payment — in production this would be Stripe Elements */}
          <div className="border rounded-lg p-6 bg-gray-50 mb-6">
            <p className="text-sm text-gray-600 mb-4">
              This is a mock payment form. In production, you would integrate
              Stripe Elements or a similar payment provider here.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    updateFormData({
                      paymentMethod: e.target.value as
                        | "credit_card"
                        | "paypal"
                        | "bank_transfer",
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="bg-white border rounded p-4 text-center text-sm text-gray-500">
                Mock card: 4242 4242 4242 4242 | Exp: 12/27 | CVC: 123
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="border rounded px-6 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-blue-600 text-white rounded px-6 py-2 font-medium
                         hover:bg-blue-700 transition-colors"
            >
              Review Order
            </button>
          </div>
        </div>
      );

    case CheckoutStep.REVIEW:
      return (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6">Review Order</h2>

          {/* Shipping Summary */}
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">Shipping To</h3>
            <p className="text-sm text-gray-600">
              {formData.shippingAddress.firstName}{" "}
              {formData.shippingAddress.lastName}
              <br />
              {formData.shippingAddress.line1}
              <br />
              {formData.shippingAddress.line2 && (
                <>
                  {formData.shippingAddress.line2}
                  <br />
                </>
              )}
              {formData.shippingAddress.city},{" "}
              {formData.shippingAddress.state}{" "}
              {formData.shippingAddress.postalCode}
            </p>
          </div>

          {/* Cart Summary */}
          {cart && (
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">Order Items</h3>
              {cart.items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex justify-between text-sm py-1"
                >
                  <span>
                    {item.product.title} ({item.variant.name}) x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.variant.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(cart.totals.total)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="border rounded px-6 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmitOrder}
              className="bg-green-600 text-white rounded px-6 py-2 font-medium
                         hover:bg-green-700 transition-colors"
            >
              Place Order
            </button>
          </div>
        </div>
      );

    case CheckoutStep.PROCESSING:
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your order...</p>
        </div>
      );

    case CheckoutStep.COMPLETE:
      return order ? (
        <OrderConfirmation order={order} onContinueShopping={reset} />
      ) : null;

    case CheckoutStep.ERROR:
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
          <p className="text-red-500 mb-6">
            {error || "Something went wrong"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="border rounded px-6 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <a
              href="/cart"
              className="bg-blue-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Cart
            </a>
          </div>
        </div>
      );
  }
}
