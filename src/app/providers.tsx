// ============================================================
// Providers — The wrapper that enables shared state across the app
// ============================================================
//
// WHY THIS FILE EXISTS:
//   layout.tsx is a Server Component (so it can export metadata).
//   But CartProvider uses hooks (useState, useEffect) which need "use client".
//   We can't put "use client" in layout.tsx without losing metadata support.
//
//   Solution: put all client-side providers in this separate file with "use client",
//   then import it into layout.tsx. Next.js handles the Server/Client boundary.
//
// HOW IT WORKS:
//   layout.tsx renders <Providers>{children}</Providers>
//   → Providers wraps children in <CartProvider>
//   → CartProvider makes cart state available to NavBar, ProductList, Cart, etc.
//
// SCALING UP:
//   As the app grows, you'd nest more providers here:
//     <AuthProvider>
//       <ThemeProvider>
//         <CartProvider>
//           {children}
//         </CartProvider>
//       </ThemeProvider>
//     </AuthProvider>
// ============================================================

"use client";

import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
