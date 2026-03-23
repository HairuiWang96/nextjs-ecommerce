// ============================================================
// TYPESCRIPT PATTERNS: Interfaces, Enums, Union Types, Readonly
// ============================================================

// PATTERN: "const assertion" object vs enum
// Prefer "as const" objects over enums — they're more flexible,
//! tree-shakeable, and work better with type inference.
//! Enums generate runtime code; const objects are zero-cost.
export const ProductStatus = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    ARCHIVED: 'archived',
} as const;

// PATTERN: Extracting a union type from a const object
// typeof gets the type of the object, keyof gets its keys,
// then we index into it to get the union of all values.
// Result: "active" | "draft" | "archived"
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

// PATTERN: Interface vs Type
// Use `interface` for object shapes that might be extended.
// Use `type` for unions, intersections, and computed types.
export interface ProductVariant {
    id: string;
    name: string; // e.g., "Small", "Red", "Premium"
    sku: string;
    price: number; // in cents — always use cents to avoid floating point issues
    compareAtPrice?: number; // PATTERN: optional property with `?`
    inventory: number;
}

// PATTERN: Interface with nested types and arrays
export interface Product {
    id: string;
    title: string;
    description: string;
    slug: string;
    status: ProductStatus; // uses our union type
    variants: ProductVariant[]; // array of interfaces
    images: string[];
    category: Category;
    tags: string[];
    createdAt: string; // ISO date string
    updatedAt: string;
}

// PATTERN: Simple union type for a fixed set of categories
export type Category = 'electronics' | 'clothing' | 'home' | 'sports' | 'books' | 'other';

// PATTERN: Utility types — Partial, Pick, Omit
// `Partial<T>` makes all properties optional (great for updates)
export type ProductUpdate = Partial<Omit<Product, 'id' | 'createdAt'>>;

//! PATTERN: Pick — select only certain fields (great for list views)
export type ProductSummary = Pick<Product, 'id' | 'title' | 'slug' | 'status' | 'category'> & {
    // PATTERN: Intersection (&) to add extra computed fields
    price: number; // min price across variants
    totalInventory: number;
};

// PATTERN: Type for creating new entities (omit server-generated fields)
export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// PATTERN: Type guard — a function that narrows a type at runtime
//! Returns `value is Product` (type predicate) so TS knows the type after the check
export function isProduct(value: unknown): value is Product {
    return typeof value === 'object' && value !== null && 'id' in value && 'title' in value && 'variants' in value && Array.isArray((value as Product).variants);
}

// PATTERN: Helper to get the default/cheapest variant price
export function getMinPrice(product: Product): number {
    return Math.min(...product.variants.map(v => v.price));
}

// PATTERN: Helper to compute total inventory across variants
export function getTotalInventory(product: Product): number {
    return product.variants.reduce((sum, v) => sum + v.inventory, 0);
}

// PATTERN: Converting a full entity to a summary (mapper function)
export function toProductSummary(product: Product): ProductSummary {
    return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        status: product.status,
        category: product.category,
        price: getMinPrice(product),
        totalInventory: getTotalInventory(product),
    };
}
