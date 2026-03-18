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
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

// PATTERN: Create context with `null` default
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

  // PATTERN: Fetch on mount only — empty dependency array means "run once"
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
        quantity: 0,
      });
      if (isApiSuccess(response)) {
        setCart(response.data);
      } else {
        setError(response.error.message);
      }
    },
    []
  );

  // PATTERN: Promo code actions — returns boolean for UI feedback
  const applyPromoCode = useCallback(async (code: string): Promise<boolean> => {
    setError(null);
    const response = await apiClient.post<Cart>("/cart/promo", { code });
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
    const response = await apiClient.delete<Cart>("/cart/promo");
    if (isApiSuccess(response)) {
      setCart(response.data);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

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
