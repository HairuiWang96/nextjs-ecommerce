"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

export function NavBar() {
  const { cart } = useCart();
  const itemCount = cart?.totals.itemCount ?? 0;

  return (
    <nav className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Phoenix Store
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
