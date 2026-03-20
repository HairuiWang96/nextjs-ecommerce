// ============================================================
// Root Layout — The outer shell that wraps EVERY page
// ============================================================
//
// HOW NEXT.JS APP ROUTER PAGES WORK:
//
//!   layout.tsx  = the FRAME (stays the same on every page, never unmounts)
//!   page.tsx    = the CONTENT (swaps out when the URL changes)
//
//   Think of layout.tsx as a picture frame, and page.tsx as the photo inside.
//   When you navigate, only the photo changes — the frame stays.
//
// WHAT RENDERS ON EACH URL:
//
//   URL          layout.tsx (always)    {children} becomes
//   ──────────   ───────────────────    ─────────────────────
//   /            NavBar + <main>        app/page.tsx         (ProductList)
//   /cart        NavBar + <main>        app/cart/page.tsx    (Cart)
//   /checkout    NavBar + <main>        app/checkout/page.tsx (CheckoutForm)
//
// THE NESTING ORDER (like Russian dolls):
//
//   <html>
//     <body>
//       <Providers>              ← makes cart state available to everything inside
//         <NavBar />             ← always visible, uses useCart() for item count badge
//         <main>{children}</main> ← {children} = the current page based on URL
//       </Providers>
//     </body>
//   </html>
//
// WHY <NavBar /> IS INSIDE <Providers>:
//   NavBar calls useCart() to show the cart item count.
//   useCart() only works inside a CartProvider.
//   If NavBar was outside <Providers>, it would crash.
//
// WHY THIS FILE HAS NO "use client":
//!   This is a Server Component (the default in App Router).
//   It can export `metadata` (title, description) which only works in Server Components.
//   The client-side parts (Providers, NavBar) are imported as Client Components
//   via "use client" in their own files — Next.js handles the boundary automatically.
// ============================================================

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { NavBar } from './navbar';

// Load Google fonts and assign them as CSS custom properties (variables)
const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

//! metadata is a Next.js feature — sets <title> and <meta> tags in the <head>.
//! Only works in Server Components (no "use client" at the top).
export const metadata: Metadata = {
    title: 'Phoenix Store — Mini Ecommerce',
    description: 'Practice ecommerce app for live coding interview',
};

export default function RootLayout({
    children, // ← this is the current page component, determined by the URL
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Providers>
                    <NavBar />
                    <main className='max-w-6xl mx-auto px-4 py-8'>{children}</main>
                </Providers>
            </body>
        </html>
    );
}
