// ============================================================
// NavBar — Always-visible navigation bar
// ============================================================
//
// This component is rendered inside <Providers> in layout.tsx, so it
// has access to the cart via useCart(). It shows on every page because
// layout.tsx never unmounts — only {children} swaps when you navigate.
//
// The cart badge (the red circle with a number) reads cart.totals.itemCount
// from context. When a user adds/removes items anywhere in the app,
// the CartProvider updates its state, and this badge re-renders automatically.
// That's the power of React Context — shared state, no prop drilling.
// ============================================================

"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

export function NavBar() {
  // useCart() reads from CartContext — works because NavBar is inside <Providers>
  const { cart } = useCart();
  const itemCount = cart?.totals.itemCount ?? 0; // ?? 0 = fallback if cart is null (still loading)

  return (
    <nav className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Store
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm hover:text-blue-600 transition-colors">
            Products
          </Link>
          <Link
            href="/cart"
            className="text-sm hover:text-blue-600 transition-colors relative"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
