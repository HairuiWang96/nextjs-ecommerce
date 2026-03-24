// ============================================================
// In-memory data store — simulates a database for the API routes
// In a real app, this would be Prisma, Drizzle, or raw SQL
// ============================================================

import type { Product, Cart, Order, Discount } from '@/types';

// PATTERN: Module-level state — persists across requests in dev mode
// (resets on server restart)
const products: Map<string, Product> = new Map();
const carts: Map<string, Cart> = new Map();
const orders: Map<string, Order> = new Map();

// ============================================================
// IDEMPOTENCY KEYS — Prevent Double Charges
// ============================================================
// PATTERN: Idempotency ensures that repeating the same request
// (e.g., user double-clicks "Place Order") doesn't create duplicate orders.
// The client sends a unique key with each checkout request.
// If we've already processed that key, we return the cached result.
// In production, this would be stored in Redis with a TTL (e.g., 24 hours).
const idempotencyKeys: Map<string, Order> = new Map();

export const idempotencyStore = {
    get: (key: string): Order | undefined => idempotencyKeys.get(key),
    set: (key: string, order: Order): void => {
        idempotencyKeys.set(key, order);
    },
    has: (key: string): boolean => idempotencyKeys.has(key),
};

// ============================================================
// PROMO CODES — Dynamic Pricing
// ============================================================
//! PATTERN: Typed map with known promo codes and their discount rules
const promoCodes: Map<string, Discount> = new Map([
    ['SAVE10', { type: 'percentage', value: 10 }], // 10% off
    ['FLAT5', { type: 'fixed', value: 500 }], // $5.00 off
    ['SAVE20', { type: 'percentage', value: 20 }], // 20% off
    ['FREESHIP', { type: 'free_shipping' }], // free shipping
]);

//! new Map() takes an array of [key, value] pairs — each inner array is a tuple of [key, value].

// new Map([
//   ["SAVE10",   { type: "percentage", value: 10 }],   // [key, value]
//   ["FLAT5",    { type: "fixed", value: 500 }],        // [key, value]
//   ["SAVE20",   { type: "percentage", value: 20 }],    // [key, value]
//   ["FREESHIP", { type: "free_shipping" }],             // [key, value]
// ])
//! It's the same idea as Object.entries() returning [key, value] pairs — Maps use that same format for initialization.

// The alternative without the shorthand would be:

// const promoCodes = new Map<string, Discount>();
// promoCodes.set("SAVE10", { type: "percentage", value: 10 });
// promoCodes.set("FLAT5", { type: "fixed", value: 500 });
// promoCodes.set("SAVE20", { type: "percentage", value: 20 });
// promoCodes.set("FREESHIP", { type: "free_shipping" });
//! Both do the same thing — the array-of-arrays version is just more concise for pre-populating a Map.

// Why Map instead of a plain object? Maps are designed for key-value lookups — promoCodes.get("SAVE10") is explicit and type-safe, and Maps have built-in .has(), .delete(), .size, etc. For a lookup table like promo codes, Map is a natural fit.

export const promoCodeStore = {
    validate: (code: string): Discount | undefined => {
        return promoCodes.get(code.toUpperCase());
    },
    exists: (code: string): boolean => {
        return promoCodes.has(code.toUpperCase());
    },
};

// Seed some initial products
function seedProducts() {
    const seed: Product[] = [
        {
            id: 'prod_1',
            title: 'Wireless Bluetooth Headphones',
            description: 'Premium noise-cancelling headphones with 30-hour battery life.',
            slug: 'wireless-bluetooth-headphones',
            status: 'active',
            variants: [
                { id: 'var_1a', name: 'Black', sku: 'WBH-BLK', price: 7999, compareAtPrice: 9999, inventory: 50 },
                { id: 'var_1b', name: 'White', sku: 'WBH-WHT', price: 7999, compareAtPrice: 9999, inventory: 30 },
                { id: 'var_1c', name: 'Navy', sku: 'WBH-NVY', price: 8499, inventory: 15 },
            ],
            images: ['/images/headphones.svg'],
            category: 'electronics',
            tags: ['audio', 'wireless', 'bluetooth'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_2',
            title: 'Organic Cotton T-Shirt',
            description: 'Soft, sustainable t-shirt made from 100% organic cotton.',
            slug: 'organic-cotton-tshirt',
            status: 'active',
            variants: [
                { id: 'var_2a', name: 'S', sku: 'OCT-S', price: 2499, inventory: 100 },
                { id: 'var_2b', name: 'M', sku: 'OCT-M', price: 2499, inventory: 80 },
                { id: 'var_2c', name: 'L', sku: 'OCT-L', price: 2499, inventory: 60 },
                { id: 'var_2d', name: 'XL', sku: 'OCT-XL', price: 2799, inventory: 40 },
            ],
            images: ['/images/tshirt.svg'],
            category: 'clothing',
            tags: ['organic', 'cotton', 'sustainable'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_3',
            title: 'Smart Home Hub',
            description: 'Control all your smart devices from one central hub.',
            slug: 'smart-home-hub',
            status: 'active',
            variants: [
                { id: 'var_3a', name: 'Standard', sku: 'SHH-STD', price: 12999, compareAtPrice: 14999, inventory: 25 },
                { id: 'var_3b', name: 'Pro', sku: 'SHH-PRO', price: 19999, inventory: 10 },
            ],
            images: ['/images/hub.svg'],
            category: 'electronics',
            tags: ['smart-home', 'iot', 'automation'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_4',
            title: 'Running Shoes',
            description: 'Lightweight running shoes with responsive cushioning.',
            slug: 'running-shoes',
            status: 'active',
            variants: [
                { id: 'var_4a', name: 'US 8', sku: 'RS-8', price: 11999, inventory: 20 },
                { id: 'var_4b', name: 'US 9', sku: 'RS-9', price: 11999, inventory: 25 },
                { id: 'var_4c', name: 'US 10', sku: 'RS-10', price: 11999, inventory: 30 },
                { id: 'var_4d', name: 'US 11', sku: 'RS-11', price: 11999, inventory: 15 },
            ],
            images: ['/images/shoes.svg'],
            category: 'sports',
            tags: ['running', 'athletic', 'shoes'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_5',
            title: 'Stainless Steel Water Bottle',
            description: 'Double-walled insulated bottle that keeps drinks cold for 24 hours.',
            slug: 'stainless-steel-water-bottle',
            status: 'active',
            variants: [
                { id: 'var_5a', name: '500ml', sku: 'SSWB-500', price: 1999, inventory: 75 },
                { id: 'var_5b', name: '750ml', sku: 'SSWB-750', price: 2499, inventory: 60 },
                { id: 'var_5c', name: '1L', sku: 'SSWB-1000', price: 2999, compareAtPrice: 3499, inventory: 40 },
            ],
            images: ['/images/bottle.svg'],
            category: 'other',
            tags: ['hydration', 'eco-friendly', 'insulated'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_6',
            title: 'Mechanical Keyboard',
            description: 'Cherry MX switches with RGB backlighting and USB-C connection.',
            slug: 'mechanical-keyboard',
            status: 'active',
            variants: [
                { id: 'var_6a', name: 'Red Switch', sku: 'MK-RED', price: 8999, inventory: 35 },
                { id: 'var_6b', name: 'Blue Switch', sku: 'MK-BLU', price: 8999, inventory: 30 },
                { id: 'var_6c', name: 'Brown Switch', sku: 'MK-BRN', price: 9499, compareAtPrice: 10999, inventory: 20 },
            ],
            images: ['/images/keyboard.svg'],
            category: 'electronics',
            tags: ['keyboard', 'mechanical', 'gaming'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_7',
            title: 'Yoga Mat',
            description: 'Non-slip natural rubber yoga mat with alignment markings.',
            slug: 'yoga-mat',
            status: 'active',
            variants: [
                { id: 'var_7a', name: '4mm', sku: 'YM-4', price: 3499, inventory: 45 },
                { id: 'var_7b', name: '6mm', sku: 'YM-6', price: 4499, inventory: 35 },
            ],
            images: ['/images/yogamat.svg'],
            category: 'sports',
            tags: ['yoga', 'fitness', 'exercise'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_8',
            title: 'Leather Wallet',
            description: 'Slim bifold wallet made from genuine full-grain leather.',
            slug: 'leather-wallet',
            status: 'active',
            variants: [
                { id: 'var_8a', name: 'Black', sku: 'LW-BLK', price: 4999, inventory: 50 },
                { id: 'var_8b', name: 'Brown', sku: 'LW-BRN', price: 4999, inventory: 40 },
                { id: 'var_8c', name: 'Tan', sku: 'LW-TAN', price: 5499, compareAtPrice: 6999, inventory: 25 },
            ],
            images: ['/images/wallet.svg'],
            category: 'other',
            tags: ['leather', 'wallet', 'everyday-carry'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_9',
            title: 'Wireless Charging Pad',
            description: 'Fast 15W Qi wireless charger compatible with all modern phones.',
            slug: 'wireless-charging-pad',
            status: 'active',
            variants: [
                { id: 'var_9a', name: 'Single', sku: 'WCP-S', price: 1999, inventory: 80 },
                { id: 'var_9b', name: 'Dual', sku: 'WCP-D', price: 3499, compareAtPrice: 3999, inventory: 45 },
            ],
            images: ['/images/charger.svg'],
            category: 'electronics',
            tags: ['wireless', 'charging', 'qi'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_10',
            title: 'Denim Jacket',
            description: 'Classic trucker-style denim jacket with a modern slim fit.',
            slug: 'denim-jacket',
            status: 'active',
            variants: [
                { id: 'var_10a', name: 'S', sku: 'DJ-S', price: 6999, inventory: 30 },
                { id: 'var_10b', name: 'M', sku: 'DJ-M', price: 6999, inventory: 25 },
                { id: 'var_10c', name: 'L', sku: 'DJ-L', price: 6999, inventory: 20 },
                { id: 'var_10d', name: 'XL', sku: 'DJ-XL', price: 7499, inventory: 15 },
            ],
            images: ['/images/jacket.svg'],
            category: 'clothing',
            tags: ['denim', 'jacket', 'outerwear'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_11',
            title: 'Portable Bluetooth Speaker',
            description: 'Waterproof speaker with 360-degree sound and 12-hour battery.',
            slug: 'portable-bluetooth-speaker',
            status: 'active',
            variants: [
                { id: 'var_11a', name: 'Black', sku: 'PBS-BLK', price: 4999, compareAtPrice: 5999, inventory: 40 },
                { id: 'var_11b', name: 'Teal', sku: 'PBS-TEL', price: 4999, inventory: 30 },
                { id: 'var_11c', name: 'Red', sku: 'PBS-RED', price: 4999, inventory: 20 },
            ],
            images: ['/images/speaker.svg'],
            category: 'electronics',
            tags: ['audio', 'bluetooth', 'waterproof'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'prod_12',
            title: 'Canvas Backpack',
            description: 'Durable waxed canvas backpack with padded laptop compartment.',
            slug: 'canvas-backpack',
            status: 'active',
            variants: [
                { id: 'var_12a', name: 'Olive', sku: 'CB-OLV', price: 7999, inventory: 25 },
                { id: 'var_12b', name: 'Charcoal', sku: 'CB-CHR', price: 7999, inventory: 20 },
                { id: 'var_12c', name: 'Navy', sku: 'CB-NVY', price: 8499, compareAtPrice: 9999, inventory: 15 },
            ],
            images: ['/images/backpack.svg'],
            category: 'other',
            tags: ['backpack', 'canvas', 'laptop'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    seed.forEach(p => products.set(p.id, p));
}

// Initialize seed data
seedProducts();

// Simple ID generator
let idCounter = 100;
export function generateId(prefix: string): string {
    return `${prefix}_${++idCounter}`;
}

// ---- Product Store ----
export const productStore = {
    getAll: (): Product[] => Array.from(products.values()),
    getById: (id: string): Product | undefined => products.get(id),
    getBySlug: (slug: string): Product | undefined => Array.from(products.values()).find(p => p.slug === slug),
    create: (product: Product): void => {
        products.set(product.id, product);
    },
    update: (id: string, updates: Partial<Product>): Product | undefined => {
        const existing = products.get(id);
        if (!existing) return undefined;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        products.set(id, updated);
        return updated;
    },
    delete: (id: string): boolean => products.delete(id),
};

// ============================================================
// INVENTORY MANAGEMENT — Race Condition Protection
// ============================================================
//! PATTERN: "Reserve then charge" to prevent overselling
//
// The problem: Two users both see "5 in stock" and both try to buy 3.
// Without protection, both succeed → we've sold 6 of 5 items.
//
//! The solution:
// 1. reserveInventory() — check stock & deduct BEFORE payment
// 2. If payment fails → releaseInventory() to restore the stock
// 3. If payment succeeds → inventory already deducted, done
//
//! In production with a real DB, you'd use:
// - SQL: UPDATE ... WHERE inventory >= quantity (atomic compare-and-swap)
// - Or: SELECT ... FOR UPDATE (pessimistic locking)
// - Or: Redis DECR with check (for high-throughput)

interface InventoryReservation {
    productId: string;
    variantId: string;
    quantity: number;
}

export const inventoryManager = {
    // Reserve inventory — returns success or the item that failed
    reserve: (items: InventoryReservation[]): { success: true } | { success: false; failedItem: string } => {
        // First pass: validate ALL items have sufficient stock
        for (const item of items) {
            const product = products.get(item.productId);
            if (!product) return { success: false, failedItem: item.productId };

            const variant = product.variants.find(v => v.id === item.variantId);
            if (!variant) return { success: false, failedItem: item.variantId };

            if (variant.inventory < item.quantity) {
                return {
                    success: false,
                    failedItem: `${product.title} (${variant.name}) — only ${variant.inventory} left`,
                };
            }
        }

        // Second pass: deduct inventory (only after ALL validations pass)
        for (const item of items) {
            const product = products.get(item.productId)!;
            const variant = product.variants.find(v => v.id === item.variantId)!;
            variant.inventory -= item.quantity;
        }

        return { success: true };
    },

    // Release inventory — undo reservation when payment fails
    release: (items: InventoryReservation[]): void => {
        for (const item of items) {
            const product = products.get(item.productId);
            if (!product) continue;
            const variant = product.variants.find(v => v.id === item.variantId);
            if (!variant) continue;
            variant.inventory += item.quantity;
        }
    },
};

// ---- Cart Store ----
export const cartStore = {
    getAll: (): Cart[] => Array.from(carts.values()),
    getById: (id: string): Cart | undefined => carts.get(id),
    save: (cart: Cart): void => {
        carts.set(cart.id, cart);
    },
    delete: (id: string): boolean => carts.delete(id),
};

// ---- Order Store ----
export const orderStore = {
    getAll: (): Order[] => Array.from(orders.values()),
    getById: (id: string): Order | undefined => orders.get(id),
    create: (order: Order): void => {
        orders.set(order.id, order);
    },
    update: (id: string, updates: Partial<Order>): Order | undefined => {
        const existing = orders.get(id);
        if (!existing) return undefined;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        orders.set(id, updated);
        return updated;
    },
};
