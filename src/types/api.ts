// ============================================================
// TYPESCRIPT PATTERNS: Generics, Conditional Types, Type Narrowing
// ============================================================

// PATTERN: Generic API response wrapper
// `T` is a type parameter — it gets replaced with the actual data type
// when you use it: ApiResponse<Product>, ApiResponse<Cart>, etc.
// This ensures ALL API responses have a consistent shape.
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string;
        code: string;
        details?: Record<string, string[]>; // field-level validation errors
      };
    };

// PATTERN: Type guard for generic API response
// Works with ANY ApiResponse<T> — the generic flows through
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: true }> {
  return response.success === true;
}

export function isApiError<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: false }> {
  return response.success === false;
}

// PATTERN: Generic paginated response
// Extends the concept — wraps any type T in pagination metadata
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// PATTERN: Helper to create paginated response from an array
// This is a generic function — `T` is inferred from the `items` argument
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  return {
    items: paginatedItems,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// PATTERN: Consistent error codes as a const object
export const ErrorCode = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  PAYMENT_FAILED: "PAYMENT_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// PATTERN: Helper to build consistent error responses
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  details?: Record<string, string[]>
): Extract<ApiResponse<never>, { success: false }> {
  return {
    success: false,
    error: { message, code, details },
  };
}

// PATTERN: Helper to build success responses
// Generic — infers T from the data you pass in
export function createSuccessResponse<T>(
  data: T
): Extract<ApiResponse<T>, { success: true }> {
  return {
    success: true,
    data,
  };
}

// PATTERN: Query params type for list endpoints
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
