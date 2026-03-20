// ============================================================
// Cart Context — Global State Management
// PATTERNS: Context API, typed Provider, async actions in context
//
// WHY THIS FILE EXISTS:
// Multiple components (Navbar, ProductList, Cart, CheckoutForm) all need
// access to the same cart data. React's Context API lets us store the cart
// in one place and share it with any component in the tree, avoiding
// "prop drilling" (passing props through many levels).
//
// HOW IT FITS TOGETHER:
//   CartProvider (this file)     — holds state + API logic
//     → CartContext              — the "pipe" that carries data down the tree
//       → useCart() hook         — how components tap into the pipe
//         → apiClient            — makes HTTP requests to /api/cart
//           → API route handlers — server-side logic (Next.js route handlers)
// ============================================================

'use client';
// ↑ This directive tells Next.js this is a Client Component.
//! Context, useState, useEffect, etc. only work on the client side.
// Server Components (the default in Next.js App Router) can't use hooks.

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

    // --- Actions ---
    // Each action is async because it makes an API call behind the scenes.
    // Components call these like: await addItem({ productId: "...", ... })
    addItem: (input: AddToCartInput) => Promise<void>;
    updateItemQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
    removeItem: (productId: string, variantId: string) => Promise<void>;
    clearError: () => void; // lets UI dismiss error messages
    refetch: () => Promise<void>; //! re-fetch cart from server (useful after checkout)
}

// PATTERN: Create context with `null` default
// We use null here (not a fake default object) because:
//   - It forces us to handle the "no provider" case explicitly
//   - The useCart() hook checks for null and throws a helpful error
//   - This avoids silent bugs where a component reads stale/empty defaults
export const CartContext = createContext<CartContextValue | null>(null);

// Props for the provider — just wraps children
interface CartProviderProps {
    children: ReactNode; //! ReactNode = anything React can render (JSX, strings, arrays, etc.)
}

// THE PROVIDER COMPONENT
// This is placed near the top of your component tree (usually in layout.tsx).
// Everything inside <CartProvider>...</CartProvider> can access the cart.
export function CartProvider({ children }: CartProviderProps) {
    // --- State ---
    // These three pieces of state drive the entire cart UI:
    const [cart, setCart] = useState<Cart | null>(null); // the cart data from the API
    const [loading, setLoading] = useState(true); // starts true because we fetch on mount
    const [error, setError] = useState<string | null>(null); // null = no error

    // --- Fetch cart from API ---
    // useCallback wraps the function so its reference stays the same across re-renders.
    // Without useCallback, a new function would be created on every render,
    // which could cause unnecessary re-renders in child components.
    const fetchCart = useCallback(async () => {
        const response = await apiClient.get<Cart>('/cart');
        // isApiSuccess is a "type guard" — it checks response.success and also
        // tells TypeScript that response.data exists (narrowing the union type).
        if (isApiSuccess(response)) {
            setCart(response.data);
        }
        setLoading(false);
    }, []);
    // ↑ Empty dependency array [] = this function never changes.
    //   It has no external dependencies that could change between renders.

    // --- Load cart when component first mounts ---
    // useEffect with [] runs ONCE after the first render — like "on page load".
    // This ensures we have cart data as soon as the app starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchCart();
    }, []);
    // ↑ We intentionally omit fetchCart from deps. We only want this to run once
    //   on mount. Including fetchCart would be technically correct but unnecessary
    //   since fetchCart never changes (it has [] deps itself).

    // --- Add item to cart ---
    // PATTERN: Every action follows the same structure:
    //   1. Clear any previous error
    //   2. Call the API
    //   3. If success → update local state with the FULL updated cart from the server
    //   4. If failure → set error message for the UI to display
    //
    //! Note: We always replace the entire cart with the server's response.
    // This keeps client and server in sync (the server is the source of truth).
    const addItem = useCallback(async (input: AddToCartInput) => {
        setError(null);
        const response = await apiClient.post<Cart>('/cart', input);
        if (isApiSuccess(response)) {
            setCart(response.data); // replace entire cart with server's version
        } else {
            setError(response.error.message);
        }
    }, []);

    // --- Update quantity of an existing item ---
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

    // --- Remove an item from the cart ---
    // Reuses the PUT /cart endpoint with quantity: 0 to signal deletion.
    // The API interprets quantity 0 as "remove this item."
    const removeItem = useCallback(async (productId: string, variantId: string) => {
        setError(null);
        const response = await apiClient.put<Cart>('/cart', {
            productId,
            variantId,
            quantity: 0, // 0 = remove this item from cart
        });
        if (isApiSuccess(response)) {
            setCart(response.data);
        } else {
            setError(response.error.message);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    // --- Bundle everything into the context value ---
    // This object is what useCart() returns to any consuming component.
    // NOTE: In a production app, you'd wrap this in useMemo to prevent
    // creating a new object on every render (which would re-render all consumers).
    const value: CartContextValue = {
        cart,
        loading,
        error,
        addItem,
        updateItemQuantity,
        removeItem,
        clearError,
        refetch: fetchCart, //! expose fetchCart as "refetch" for a clearer public API name
    };

    // --- Render the Provider ---
    // CartContext.Provider makes `value` available to all descendants.
    // Any component inside <CartProvider> can call useCart() to get this value.
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
