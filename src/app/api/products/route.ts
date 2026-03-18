// ============================================================
// API Route: /api/products
// PATTERNS: Next.js Route Handlers, typed responses, query params
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { productStore, generateId } from "@/lib/store";
import {
  createSuccessResponse,
  createErrorResponse,
  paginate,
  ErrorCode,
  type Product,
  type CreateProductInput,
  type PaginatedResponse,
  type ApiResponse,
} from "@/types";

// PATTERN: Typed GET handler with query parameters
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<Product>>>> {
  // PATTERN: Extract and type query params from URLSearchParams
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  let products = productStore.getAll();

  // Filter by search term
  if (search) {
    const lowerSearch = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerSearch) ||
        p.tags.some((t) => t.includes(lowerSearch))
    );
  }

  // Filter by category
  if (category) {
    products = products.filter((p) => p.category === category);
  }

  const paginated = paginate(products, page, pageSize);
  return NextResponse.json(createSuccessResponse(paginated));
}

// PATTERN: Typed POST handler with request body validation
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    const body = (await request.json()) as CreateProductInput;

    // PATTERN: Manual validation — in production, use zod or similar
    const errors: Record<string, string[]> = {};

    if (!body.title?.trim()) {
      errors.title = ["Title is required"];
    }
    if (!body.variants?.length) {
      errors.variants = ["At least one variant is required"];
    }
    if (body.variants?.some((v) => v.price < 0)) {
      errors.variants = [...(errors.variants || []), "Price cannot be negative"];
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        createErrorResponse("Validation failed", ErrorCode.VALIDATION_ERROR, errors),
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const product: Product = {
      ...body,
      id: generateId("prod"),
      createdAt: now,
      updatedAt: now,
    };

    productStore.create(product);

    return NextResponse.json(createSuccessResponse(product), { status: 201 });
  } catch {
    return NextResponse.json(
      createErrorResponse("Invalid request body", ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
}
