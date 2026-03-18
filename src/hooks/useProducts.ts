// ============================================================
// Custom Hook: useProducts
// PATTERNS: Generic data fetching hook, typed state, useEffect
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiSuccess, type Product, type PaginatedResponse } from "@/types";

// PATTERN: Define the return type of the hook explicitly
// This documents the hook's API and catches errors early
interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<Product>["pagination"] | null;
  refetch: () => void;
}

// PATTERN: Custom hook with typed return value
// Hooks always start with "use" — this is a React convention AND a rule
export function useProducts(page: number = 1, search: string = ""): UseProductsReturn {
  // PATTERN: Typed useState — specify the generic type parameter
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    PaginatedResponse<Product>["pagination"] | null
  >(null);

  // PATTERN: useCallback to memoize the fetch function
  // This prevents unnecessary re-renders when passed as a prop
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
    });

    // PATTERN: Using the generic API client — type flows through
    const response = await apiClient.get<PaginatedResponse<Product>>(
      `/products?${params}`
    );

    if (isApiSuccess(response)) {
      // TS knows response.data is PaginatedResponse<Product> here
      setProducts(response.data.items);
      setPagination(response.data.pagination);
    } else {
      // TS knows response.error exists here
      setError(response.error.message);
    }

    setLoading(false);
  }, [page, search]);

  // PATTERN: useEffect with dependency array
  // Runs fetchProducts whenever page or search changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error, pagination, refetch: fetchProducts };
}

// PATTERN: Hook for fetching a single product by ID
interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

export function useProduct(id: string): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const response = await apiClient.get<Product>(`/products/${id}`);

      if (isApiSuccess(response)) {
        setProduct(response.data);
      } else {
        setError(response.error.message);
      }
      setLoading(false);
    }

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}
