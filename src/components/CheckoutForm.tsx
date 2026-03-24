// ============================================================
// CheckoutForm Component
// PATTERNS: Multi-step form, field-level validation on blur,
//           idempotent submission, failure recovery with retry
// ============================================================

'use client';

import { useCheckout, CheckoutStep } from '@/hooks/useCheckout';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { OrderConfirmation } from './OrderSummary';

//! PATTERN: Reusable form field component with error display
//! Keeps the main form JSX clean and consistent
function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className='block text-sm font-medium mb-1'>
                {label} {required && '*'}
            </label>
            {children}
            {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
        </div>
    );
}

export function CheckoutForm() {
    const { step, formData, errors, order, error, attemptCount, updateShippingAddress, updateFormData, validateField, validateShippingForm, nextStep, prevStep, goToStep, submitOrder, retryOrder, reset } = useCheckout();

    const { cart, refetch } = useCart();

    // PATTERN: Validate before advancing to next step
    const handleContinueToPayment = () => {
        if (validateShippingForm()) {
            nextStep();
        }
    };

    // PATTERN: Submit with idempotency — double-click safe
    const handleSubmitOrder = async () => {
        if (!cart) return;
        await submitOrder(cart.id);
        await refetch(); // refresh cart (should be empty after checkout)
    };

    // PATTERN: Retry preserves cart — uses new idempotency key
    const handleRetry = async () => {
        if (!cart) return;
        await retryOrder(cart.id);
        await refetch();
    };

    // PATTERN: Helper for input className with error state
    const inputClass = (field: string) => `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors[field] ? 'border-red-400 focus:ring-red-500' : 'focus:ring-blue-500'}`;

    switch (step) {
        case CheckoutStep.SHIPPING:
            return (
                <div className='max-w-lg mx-auto'>
                    <h2 className='text-2xl font-bold mb-6'>Shipping Address</h2>

                    <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <FormField label='First Name' required error={errors.firstName}>
                                <input type='text' value={formData.shippingAddress.firstName} onChange={e => updateShippingAddress({ firstName: e.target.value })} onBlur={() => validateField('firstName')} className={inputClass('firstName')} />
                            </FormField>
                            <FormField label='Last Name' required error={errors.lastName}>
                                <input type='text' value={formData.shippingAddress.lastName} onChange={e => updateShippingAddress({ lastName: e.target.value })} onBlur={() => validateField('lastName')} className={inputClass('lastName')} />
                            </FormField>
                        </div>

                        <FormField label='Email' required error={errors.email}>
                            <input type='email' value={formData.customerEmail} onChange={e => updateFormData({ customerEmail: e.target.value })} onBlur={() => validateField('email')} className={inputClass('email')} />
                        </FormField>

                        <FormField label='Address Line 1' required error={errors.line1}>
                            <input type='text' value={formData.shippingAddress.line1} onChange={e => updateShippingAddress({ line1: e.target.value })} onBlur={() => validateField('line1')} className={inputClass('line1')} />
                        </FormField>

                        <FormField label='Address Line 2'>
                            <input type='text' value={formData.shippingAddress.line2 || ''} onChange={e => updateShippingAddress({ line2: e.target.value })} className={inputClass('line2')} />
                        </FormField>

                        <div className='grid grid-cols-3 gap-4'>
                            <FormField label='City' required error={errors.city}>
                                <input type='text' value={formData.shippingAddress.city} onChange={e => updateShippingAddress({ city: e.target.value })} onBlur={() => validateField('city')} className={inputClass('city')} />
                            </FormField>
                            <FormField label='State' required error={errors.state}>
                                <input type='text' value={formData.shippingAddress.state} onChange={e => updateShippingAddress({ state: e.target.value })} onBlur={() => validateField('state')} className={inputClass('state')} />
                            </FormField>
                            <FormField label='Zip Code' required error={errors.postalCode}>
                                <input type='text' value={formData.shippingAddress.postalCode} onChange={e => updateShippingAddress({ postalCode: e.target.value })} onBlur={() => validateField('postalCode')} className={inputClass('postalCode')} />
                            </FormField>
                        </div>

                        <FormField label='Order Notes'>
                            <textarea
                                value={formData.notes}
                                onChange={e => updateFormData({ notes: e.target.value })}
                                rows={3}
                                className='w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Any special instructions...'
                            />
                        </FormField>
                    </div>

                    <div className='mt-6 flex justify-end'>
                        <button
                            onClick={handleContinueToPayment}
                            className='bg-blue-600 text-white rounded px-6 py-2 font-medium
                         hover:bg-blue-700 transition-colors'
                        >
                            Continue to Payment
                        </button>
                    </div>
                </div>
            );

        case CheckoutStep.PAYMENT:
            return (
                <div className='max-w-lg mx-auto'>
                    <h2 className='text-2xl font-bold mb-6'>Payment</h2>

                    <div className='border rounded-lg p-6 bg-gray-50 mb-6'>
                        <p className='text-sm text-gray-600 mb-4'>This is a mock payment form. In production, you would integrate Stripe Elements or a similar payment provider here.</p>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium mb-1'>Payment Method</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={e =>
                                        updateFormData({
                                            paymentMethod: e.target.value as 'credit_card' | 'paypal' | 'bank_transfer',
                                        })
                                    }
                                    className='w-full border rounded px-3 py-2 text-sm'
                                >
                                    <option value='credit_card'>Credit Card</option>
                                    <option value='paypal'>PayPal</option>
                                    <option value='bank_transfer'>Bank Transfer</option>
                                </select>
                            </div>

                            <div className='bg-white border rounded p-4 text-center text-sm text-gray-500'>Mock card: 4242 4242 4242 4242 | Exp: 12/27 | CVC: 123</div>
                        </div>
                    </div>

                    <div className='flex justify-between'>
                        <button onClick={prevStep} className='border rounded px-6 py-2 text-sm hover:bg-gray-50 transition-colors'>
                            Back
                        </button>
                        <button
                            onClick={nextStep}
                            className='bg-blue-600 text-white rounded px-6 py-2 font-medium
                         hover:bg-blue-700 transition-colors'
                        >
                            Review Order
                        </button>
                    </div>
                </div>
            );

        case CheckoutStep.REVIEW:
            return (
                <div className='max-w-lg mx-auto'>
                    <h2 className='text-2xl font-bold mb-6'>Review Order</h2>

                    {/* Shipping Summary */}
                    <div className='border rounded-lg p-4 mb-4'>
                        <h3 className='font-medium mb-2'>Shipping To</h3>
                        <p className='text-sm text-gray-600'>
                            {formData.shippingAddress.firstName} {formData.shippingAddress.lastName}
                            <br />
                            {formData.shippingAddress.line1}
                            <br />
                            {formData.shippingAddress.line2 && (
                                <>
                                    {formData.shippingAddress.line2}
                                    <br />
                                </>
                            )}
                            {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.postalCode}
                        </p>
                    </div>

                    {/* Cart Summary */}
                    {cart && (
                        <div className='border rounded-lg p-4 mb-4'>
                            <h3 className='font-medium mb-2'>Order Items</h3>
                            {cart.items.map(item => (
                                <div key={`${item.productId}-${item.variantId}`} className='flex justify-between text-sm py-1'>
                                    <span>
                                        {item.product.title} ({item.variant.name}) x{item.quantity}
                                    </span>
                                    <span>{formatCurrency(item.variant.price * item.quantity)}</span>
                                </div>
                            ))}
                            {cart.totals.discount > 0 && (
                                <div className='flex justify-between text-sm py-1 text-green-600'>
                                    <span>Discount {cart.couponCode && `(${cart.couponCode})`}</span>
                                    <span>-{formatCurrency(cart.totals.discount)}</span>
                                </div>
                            )}
                            <div className='border-t mt-2 pt-2 flex justify-between font-bold'>
                                <span>Total</span>
                                <span>{formatCurrency(cart.totals.total)}</span>
                            </div>
                        </div>
                    )}

                    <div className='flex justify-between'>
                        <button onClick={prevStep} className='border rounded px-6 py-2 text-sm hover:bg-gray-50 transition-colors'>
                            Back
                        </button>
                        <button
                            onClick={handleSubmitOrder}
                            className='bg-green-600 text-white rounded px-6 py-2 font-medium
                         hover:bg-green-700 transition-colors'
                        >
                            Place Order
                        </button>
                    </div>
                </div>
            );

        case CheckoutStep.PROCESSING:
            return (
                <div className='text-center py-12'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
                    <p className='text-gray-600'>Processing your order...</p>
                    {attemptCount > 0 && <p className='text-gray-400 text-sm mt-2'>Attempt {attemptCount}</p>}
                </div>
            );

        case CheckoutStep.COMPLETE:
            return order ? <OrderConfirmation order={order} onContinueShopping={reset} /> : null;

        case CheckoutStep.ERROR:
            return (
                <div className='text-center py-12'>
                    <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </div>
                    <h2 className='text-2xl font-bold mb-2'>Payment Failed</h2>
                    <p className='text-red-500 mb-2'>{error || 'Something went wrong'}</p>
                    <p className='text-gray-400 text-sm mb-6'>Attempt {attemptCount} — your cart has been preserved</p>
                    <div className='flex gap-4 justify-center'>
                        <button onClick={() => goToStep('review')} className='border rounded px-6 py-2 text-sm hover:bg-gray-50 transition-colors'>
                            Back to Review
                        </button>
                        <button onClick={handleRetry} className='bg-blue-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors'>
                            Retry Payment
                        </button>
                    </div>
                </div>
            );
    }
}
