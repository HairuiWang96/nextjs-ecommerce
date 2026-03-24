// ============================================================
// ProductCard Component
// PATTERNS: Typed props, event handlers, callback props
// ============================================================

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product, ProductVariant } from '@/types';
import { formatCurrency } from '@/lib/formatters';

//! PATTERN: Props interface — always define props as an interface
//! This documents what the component accepts
interface ProductCardProps {
    product: Product;
    onAddToCart: (productId: string, variantId: string, quantity: number) => void;
}

// PATTERN: Destructure props in the function signature
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    // PATTERN: State with union type — selectedVariant can be a variant or null
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
    const [quantity, setQuantity] = useState(1);

    // PATTERN: Event handler with typed event
    const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const variant = product.variants.find(v => v.id === e.target.value);
        if (variant) setSelectedVariant(variant);
    };

    const handleAddToCart = () => {
        onAddToCart(product.id, selectedVariant.id, quantity);
        setQuantity(1); // reset after adding
    };

    return (
        <div className='border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow'>
            {/* Product Image — using next/image for automatic optimization */}
            <div className='rounded-md h-48 overflow-hidden mb-4 relative'>
                {product.images[0] ? (
                    <Image src={product.images[0]} alt={product.title} fill className='object-cover' />
                ) : (
                    <div className='bg-gray-200 w-full h-full flex items-center justify-center'>
                        <span className='text-gray-400 text-sm'>{product.title}</span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <h3 className='font-semibold text-lg mb-1'>{product.title}</h3>
            <p className='text-gray-600 text-sm mb-3 line-clamp-2'>{product.description}</p>

            {/* Price */}
            <p className='text-xl font-bold text-blue-600 mb-3'>
                {formatCurrency(selectedVariant.price)}
                {selectedVariant.compareAtPrice && <span className='text-sm text-gray-400 line-through ml-2'>{formatCurrency(selectedVariant.compareAtPrice)}</span>}
            </p>

            {/* Variant Selector */}
            {product.variants.length > 1 && (
                <div className='mb-3'>
                    <label className='block text-sm text-gray-600 mb-1'>Option</label>
                    <select value={selectedVariant.id} onChange={handleVariantChange} className='w-full border rounded px-3 py-2 text-sm'>
                        {product.variants.map(variant => (
                            <option key={variant.id} value={variant.id}>
                                {variant.name} — {formatCurrency(variant.price)}
                                {variant.inventory === 0 ? ' (Out of stock)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className='flex gap-2'>
                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className='border rounded px-2 py-2 text-sm w-16'>
                    {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAddToCart}
                    disabled={selectedVariant.inventory === 0}
                    className='flex-1 bg-blue-600 text-white rounded py-2 px-4 text-sm font-medium
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors'
                >
                    {selectedVariant.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>

            {/* Stock indicator */}
            {selectedVariant.inventory > 0 && selectedVariant.inventory <= 10 && <p className='text-orange-500 text-xs mt-2'>Only {selectedVariant.inventory} left in stock</p>}
        </div>
    );
}
