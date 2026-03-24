// ============================================================
// Cart Context — Global State Management
// PATTERNS: Context API, typed Provider, async actions in context
// ============================================================
//
// HOW IT FITS TOGETHER:
//   CartProvider (this file)     — holds state + API logic
//     → CartContext              — the "pipe" that carries data down the tree
//       → useCart() hook         — how components tap into the pipe
//         → apiClient            — makes HTTP requests to /api/cart
//           → API route handlers — server-side logic (Next.js route handlers)
//
// WHAT'S DIFFERENT FROM THE BASIC BRANCH:
//   basic branch:   addItem, updateItemQuantity, removeItem, clearError, refetch
//   this branch:    all of the above PLUS applyPromoCode and removePromoCode
//
//   The promo code actions follow the same pattern as the other actions
//   (clear error → call API → update cart or set error) but use different
//   endpoints (POST /cart/promo and DELETE /cart/promo).
//   applyPromoCode also returns a boolean so the UI can show success/failure feedback.
// ============================================================

'use client';
//! ↑ This directive tells Next.js this is a Client Component.
//! Context, useState, useEffect, etc. only work on the client side.
//! Server Components (the default in Next.js App Router) can't use hooks.

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { isApiSuccess, type Cart, type AddToCartInput } from '@/types';

// PATTERN: Define the context value type as an interface
// This is the "shape" of what any component gets when it calls useCart().
// It includes both DATA (cart, loading, error) and ACTIONS (addItem, removeItem, etc.).
// Grouping data + actions together is a common React Context pattern.
export interface CartContextValue {
    // --- Data ---
    cart: Cart | null; // null until the first fetch completes
    loading: boolean; // true while fetching cart from the API
    error: string | null; // holds error message if an action fails, null otherwise

    // --- Actions (same as basic branch) ---
    addItem: (input: AddToCartInput) => Promise<void>;
    updateItemQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
    removeItem: (productId: string, variantId: string) => Promise<void>;
    clearError: () => void; //! lets UI dismiss error messages
    refetch: () => Promise<void>; //! re-fetch cart from server (useful after checkout)

    // --- NEW in feature branch: Promo code actions ---
    // These don't exist in the basic branch.
    // applyPromoCode returns a boolean so the UI knows if the code was valid.
    // removePromoCode just strips the discount — no return value needed.
    applyPromoCode: (code: string) => Promise<boolean>;
    removePromoCode: () => Promise<void>;
}

// PATTERN: Create context with `null` default
// We use null here (not a fake default object) because:
//   - It forces us to handle the "no provider" case explicitly
//   - The useCart() hook checks for null and throws a helpful error
//   - This avoids silent bugs where a component reads stale/empty defaults
export const CartContext = createContext<CartContextValue | null>(null);

// PATTERN: Provider component with typed props
interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch cart on mount
    const fetchCart = useCallback(async () => {
        const response = await apiClient.get<Cart>('/cart');
        if (isApiSuccess(response)) {
            setCart(response.data);
        }
        setLoading(false);
    }, []);

    // PATTERN: Fetch on mount only — empty dependency array means "run once"
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchCart();
    }, []);

    // PATTERN: Async action in context
    const addItem = useCallback(async (input: AddToCartInput) => {
        setError(null);
        const response = await apiClient.post<Cart>('/cart', input);
        if (isApiSuccess(response)) {
            setCart(response.data);
        } else {
            setError(response.error.message);
        }
    }, []);

    const updateItemQuantity = useCallback(async (productId: string, variantId: string, quantity: number) => {
        setError(null);
        const response = await apiClient.put<Cart>('/cart', {
            productId,
            variantId,
            quantity,
        });
        if (isApiSuccess(response)) {
            setCart(response.data);
        } else {
            setError(response.error.message);
        }
    }, []);

    const removeItem = useCallback(async (productId: string, variantId: string) => {
        setError(null);
        const response = await apiClient.put<Cart>('/cart', {
            productId,
            variantId,
            quantity: 0,
        });
        if (isApiSuccess(response)) {
            setCart(response.data);
        } else {
            setError(response.error.message);
        }
    }, []);

    // ============================================================
    // NEW IN FEATURE BRANCH: Promo code actions
    // ============================================================
    // These don't exist in the basic branch. They follow the same pattern
    //! as addItem/updateItemQuantity (clear error → call API → update cart),
    // but with two differences:
    //   1. applyPromoCode returns a boolean (true = code valid, false = invalid)
    //      so the UI can show "Code applied!" or "Invalid code" feedback
    //   2. removePromoCode uses DELETE instead of POST/PUT
    //
    // PATTERN: Promo code actions — returns boolean for UI feedback
    const applyPromoCode = useCallback(async (code: string): Promise<boolean> => {
        setError(null);
        const response = await apiClient.post<Cart>('/cart/promo', { code });
        if (isApiSuccess(response)) {
            setCart(response.data);
            return true;
        } else {
            setError(response.error.message);
            return false;
        }
    }, []);

    const removePromoCode = useCallback(async () => {
        setError(null);
        const response = await apiClient.delete<Cart>('/cart/promo');
        if (isApiSuccess(response)) {
            setCart(response.data);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    // Bundle everything into the context value.
    // This object is what useCart() returns to any consuming component.
    const value: CartContextValue = {
        cart,
        loading,
        error,
        addItem,
        updateItemQuantity,
        removeItem,
        applyPromoCode,
        removePromoCode,
        clearError,
        refetch: fetchCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
