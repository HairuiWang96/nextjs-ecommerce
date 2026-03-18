// ============================================================
// Typed Fetch Wrapper — Generic API Client
// PATTERNS: Generics in practice, async/await typing, error handling
// ============================================================

import type { ApiResponse } from "@/types";

const BASE_URL = "/api";

// PATTERN: Generic async function
// The caller specifies <T>, and the return type flows through:
//   const products = await apiClient.get<Product[]>("/products")
//   // products is ApiResponse<Product[]>
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    // PATTERN: The response JSON is typed as ApiResponse<T>
    const data: ApiResponse<T> = await response.json();
    return data;
  } catch {
    // Network errors or JSON parse failures
    return {
      success: false,
      error: {
        message: "Network error — please try again",
        code: "NETWORK_ERROR",
      },
    };
  }
}

// PATTERN: Object with methods that use the generic request function
// Each method provides a convenient API and passes through the generic <T>
export const apiClient = {
  get: <T>(endpoint: string): Promise<ApiResponse<T>> =>
    request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {
      method: "DELETE",
    }),
};
