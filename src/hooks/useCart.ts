// ============================================================
// Custom Hook: useCart
// PATTERNS: Context consumer hook, optimistic updates
// ============================================================

"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

// PATTERN: Simple consumer hook that wraps useContext
// This is a common pattern — provides a nice error message if
// the hook is used outside its Provider
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
