"use client";

import { CartProvider } from "@/context/CartContext";

// PATTERN: Providers wrapper — keeps layout.tsx clean
// Add more providers here as needed (theme, auth, etc.)
export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
