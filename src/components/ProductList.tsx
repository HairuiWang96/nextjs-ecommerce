// ============================================================
// ProductList Component
// PATTERNS: Loading/error states, conditional rendering, composition
// ============================================================

'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { ProductCard } from './ProductCard';

export function ProductList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const { products, loading, error, pagination } = useProducts(page, search);
    const { addItem } = useCart();

    // PATTERN: Handler that bridges component callback to context action
    const handleAddToCart = async (productId: string, variantId: string, quantity: number) => {
        await addItem({ productId, variantId, quantity });
    };

    //! PATTERN: Early returns for loading and error states
    if (loading) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className='border rounded-lg p-4 animate-pulse'>
                        <div className='bg-gray-200 rounded-md h-48 mb-4' />
                        <div className='bg-gray-200 rounded h-6 mb-2 w-3/4' />
                        <div className='bg-gray-200 rounded h-4 mb-3 w-full' />
                        <div className='bg-gray-200 rounded h-8 w-1/3' />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className='text-center py-12'>
                <p className='text-red-500 mb-4'>{error}</p>
                <button onClick={() => setPage(1)} className='text-blue-600 underline'>
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Search */}
            <div className='mb-6'>
                <input
                    type='text'
                    placeholder='Search products...'
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(1); // reset to page 1 on search
                    }}
                    className='w-full max-w-md border rounded-lg px-4 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
                <p className='text-center text-gray-500 py-12'>No products found{search ? ` for "${search}"` : ''}.</p>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className='flex justify-center gap-2 mt-8'>
                    <button
                        onClick={() => setPage(p => p - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className='px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 transition-colors'
                    >
                        Previous
                    </button>
                    <span className='px-4 py-2 text-sm text-gray-600'>
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!pagination.hasNextPage}
                        className='px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 transition-colors'
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
