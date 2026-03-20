// ============================================================
// Homepage — src/app/page.tsx
// ============================================================
//
// THIS IS THE HOMEPAGE (URL: /)
//
// In Next.js App Router, the file path determines the URL:
//   src/app/page.tsx          →  /           (this file — the homepage)
//   src/app/cart/page.tsx     →  /cart
//   src/app/checkout/page.tsx →  /checkout
//
// This component gets injected into layout.tsx's {children} slot.
// So the final page the user sees is: NavBar + this content.
//
// This is a Server Component (no "use client") — it renders on the server.
// But <ProductList /> inside it is a Client Component (has "use client"),
// so Next.js renders the static parts on the server and hydrates
// the interactive parts on the client. This mix is normal in App Router.
// ============================================================

import { ProductList } from "@/components/ProductList";

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Products</h1>
      <p className="text-gray-600 mb-8">Browse our catalog</p>
      <ProductList />
    </div>
  );
}
