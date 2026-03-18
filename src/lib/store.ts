// ============================================================
// In-memory data store — simulates a database for the API routes
// In a real app, this would be Prisma, Drizzle, or raw SQL
// ============================================================

import type { Product, Cart, Order } from "@/types";

// PATTERN: Module-level state — persists across requests in dev mode
// (resets on server restart)
const products: Map<string, Product> = new Map();
const carts: Map<string, Cart> = new Map();
const orders: Map<string, Order> = new Map();

// Seed some initial products
function seedProducts() {
  const seed: Product[] = [
    {
      id: "prod_1",
      title: "Wireless Bluetooth Headphones",
      description: "Premium noise-cancelling headphones with 30-hour battery life.",
      slug: "wireless-bluetooth-headphones",
      status: "active",
      variants: [
        { id: "var_1a", name: "Black", sku: "WBH-BLK", price: 7999, inventory: 50 },
        { id: "var_1b", name: "White", sku: "WBH-WHT", price: 7999, inventory: 30 },
        { id: "var_1c", name: "Navy", sku: "WBH-NVY", price: 8499, inventory: 15 },
      ],
      images: ["/images/headphones.svg"],
      category: "electronics",
      tags: ["audio", "wireless", "bluetooth"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_2",
      title: "Organic Cotton T-Shirt",
      description: "Soft, sustainable t-shirt made from 100% organic cotton.",
      slug: "organic-cotton-tshirt",
      status: "active",
      variants: [
        { id: "var_2a", name: "S", sku: "OCT-S", price: 2499, inventory: 100 },
        { id: "var_2b", name: "M", sku: "OCT-M", price: 2499, inventory: 80 },
        { id: "var_2c", name: "L", sku: "OCT-L", price: 2499, inventory: 60 },
        { id: "var_2d", name: "XL", sku: "OCT-XL", price: 2799, inventory: 40 },
      ],
      images: ["/images/tshirt.svg"],
      category: "clothing",
      tags: ["organic", "cotton", "sustainable"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_3",
      title: "Smart Home Hub",
      description: "Control all your smart devices from one central hub.",
      slug: "smart-home-hub",
      status: "active",
      variants: [
        { id: "var_3a", name: "Standard", sku: "SHH-STD", price: 12999, inventory: 25 },
        { id: "var_3b", name: "Pro", sku: "SHH-PRO", price: 19999, inventory: 10 },
      ],
      images: ["/images/hub.svg"],
      category: "electronics",
      tags: ["smart-home", "iot", "automation"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_4",
      title: "Running Shoes",
      description: "Lightweight running shoes with responsive cushioning.",
      slug: "running-shoes",
      status: "active",
      variants: [
        { id: "var_4a", name: "US 8", sku: "RS-8", price: 11999, inventory: 20 },
        { id: "var_4b", name: "US 9", sku: "RS-9", price: 11999, inventory: 25 },
        { id: "var_4c", name: "US 10", sku: "RS-10", price: 11999, inventory: 30 },
        { id: "var_4d", name: "US 11", sku: "RS-11", price: 11999, inventory: 15 },
      ],
      images: ["/images/shoes.svg"],
      category: "sports",
      tags: ["running", "athletic", "shoes"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  seed.forEach((p) => products.set(p.id, p));
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
  getBySlug: (slug: string): Product | undefined =>
    Array.from(products.values()).find((p) => p.slug === slug),
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
