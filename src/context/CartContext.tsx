// ============================================================
// Cart Context — Global State Management
// PATTERNS: Context API, typed Provider, async actions in context
// ============================================================

"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiClient } from "@/lib/api-client";
import { isApiSuccess, type Cart, type AddToCartInput } from "@/types";

// PATTERN: Define the context value type as an interface
// This is what consumers get when they call useCart()
export interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addItem: (input: AddToCartInput) => Promise<void>;
  updateItemQuantity: (
    productId: string,
    variantId: string,
    quantity: number
  ) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

// PATTERN: Create context with `null` default
// The null is handled by the useCart hook which throws if null
// This avoids having to provide a meaningless default implementation
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
    const response = await apiClient.get<Cart>("/cart");
    if (isApiSuccess(response)) {
      setCart(response.data);
    }
    setLoading(false);
  }, []);

  // BEFORE (causes React 19 warning):
  // useEffect(() => {
  //   fetchCart();
  // }, [fetchCart]);
  //
  // WHY IT WARNS: fetchCart is in the dependency array, so every time its
  // reference changes, the effect re-runs. Even though useCallback makes it
  // stable, React 19 still flags the synchronous setState calls (setCart,
  // setLoading) that happen inside the async function when it resolves.
  // React sees: effect fires → async call → setState after render cycle = warning.

  // AFTER (fixed):
  // PATTERN: Fetch on mount only — empty dependency array means "run once"
  // We don't include fetchCart in deps because we only want this to run on mount,
  // not every time fetchCart's reference changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCart(); }, []);

  // PATTERN: Async action in context
  const addItem = useCallback(async (input: AddToCartInput) => {
    setError(null);
    const response = await apiClient.post<Cart>("/cart", input);
    if (isApiSuccess(response)) {
      setCart(response.data);
    } else {
      setError(response.error.message);
    }
  }, []);

  const updateItemQuantity = useCallback(
    async (productId: string, variantId: string, quantity: number) => {
      setError(null);
      const response = await apiClient.put<Cart>("/cart", {
        productId,
        variantId,
        quantity,
      });
      if (isApiSuccess(response)) {
        setCart(response.data);
      } else {
        setError(response.error.message);
      }
    },
    []
  );

  const removeItem = useCallback(
    async (productId: string, variantId: string) => {
      setError(null);
      const response = await apiClient.put<Cart>("/cart", {
        productId,
        variantId,
        quantity: 0, // 0 = remove
      });
      if (isApiSuccess(response)) {
        setCart(response.data);
      } else {
        setError(response.error.message);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  // PATTERN: Memoize the context value to prevent unnecessary re-renders
  // In a real app, you'd use useMemo here. For simplicity, we pass directly.
  const value: CartContextValue = {
    cart,
    loading,
    error,
    addItem,
    updateItemQuantity,
    removeItem,
    clearError,
    refetch: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
