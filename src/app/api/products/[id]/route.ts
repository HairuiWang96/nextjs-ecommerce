// ============================================================
// API Route: /api/products/[id]
// PATTERNS: Dynamic route params, CRUD operations
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { productStore } from "@/lib/store";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCode,
  type Product,
  type ProductUpdate,
  type ApiResponse,
} from "@/types";

// PATTERN: Next.js 15+ dynamic route params (passed as second argument)
type RouteParams = { params: Promise<{ id: string }> };

// GET /api/products/:id
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Product>>> {
  const { id } = await params;
  const product = productStore.getById(id);

  if (!product) {
    return NextResponse.json(
      createErrorResponse(`Product ${id} not found`, ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  return NextResponse.json(createSuccessResponse(product));
}

// PUT /api/products/:id
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Product>>> {
  const { id } = await params;

  try {
    // PATTERN: Cast the body to our update type (Partial<Product> minus readonly fields)
    const body = (await request.json()) as ProductUpdate;
    const updated = productStore.update(id, body);

    if (!updated) {
      return NextResponse.json(
        createErrorResponse(`Product ${id} not found`, ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(updated));
  } catch {
    return NextResponse.json(
      createErrorResponse("Invalid request body", ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
}

// DELETE /api/products/:id
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  const { id } = await params;
  const existed = productStore.getById(id);

  if (!existed) {
    return NextResponse.json(
      createErrorResponse(`Product ${id} not found`, ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  productStore.delete(id);
  return NextResponse.json(createSuccessResponse({ deleted: true }));
}
