# Project: Next.js Ecommerce

Full-stack ecommerce application built with Next.js 16, React 19, and TypeScript. Uses Tailwind CSS v4 for styling.

## Quick Commands
- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build (also type-checks)
- `npm run lint` — ESLint

## Architecture

### Stack
- **Framework**: Next.js 16 App Router (`src/app/`)
- **Frontend**: React 19 with Context API for state management
- **Backend**: Next.js API routes (`src/app/api/`)
- **Data**: In-memory store (`src/lib/store.ts`) — no database, all data resets on server restart
- **Styling**: Tailwind CSS v4

### Key Directories
```
src/
├── app/                    # Pages + API routes
│   ├── api/products/       # Product CRUD (GET, POST, PUT, DELETE)
│   ├── api/cart/           # Cart ops + promo codes
│   ├── api/checkout/       # Order submission (saga pattern)
│   ├── cart/               # Cart page
│   └── checkout/           # Checkout page
├── components/             # ProductList, ProductCard, Cart, CheckoutForm, OrderSummary
├── context/CartContext.tsx  # Cart state via React Context
├── hooks/                  # useProducts, useCart, useCheckout
├── lib/                    # store, api-client, validators, formatters
└── types/                  # TypeScript types (product, cart, order, api) with barrel export
```

### TypeScript Patterns Used
- Generics (`ApiResponse<T>`, `PaginatedResponse<T>`)
- Discriminated unions (payment types, discount types, API responses)
- Type guards (`isApiSuccess()`, `isPaymentSuccess()`)
- Utility types (`Partial`, `Pick`, `Omit`)
- `as const` objects instead of enums
- Learning comments throughout explaining patterns

## Features

### Core
- Product catalog with search, pagination, variant selection
- Shopping cart with quantity controls and product images
- Multi-step checkout: Shipping → Payment → Review → Processing → Complete/Error

### Advanced (added on `feature/realistic-ecommerce` branch)
- **Inventory reservation**: Reserve stock at checkout, release on payment failure (saga pattern)
- **Idempotency keys**: Prevent double charges — `Idempotency-Key` header on checkout requests
- **Promo codes**: SAVE10 (10%), SAVE20 (20%), FLAT5 ($5 off), FREESHIP — applied via `POST /api/cart/promo`
- **Field-level validation**: Validates on blur, red borders + error messages, `validateField()` / `validateShippingForm()`
- **Payment retry**: 20% random failure, server retries 3x with exponential backoff, frontend retry button
- **Checkout failure recovery**: Cart preserved on failure, "Back to Review" or "Retry Payment" options

## Git Branches
- `main` / `basic` — Core ecommerce (products, cart, checkout)
- `feature/realistic-ecommerce` — All advanced features added

## Known Quirks
- React 19 `setState` in `useEffect` warning — suppressed with `eslint-disable` + empty deps array in CartContext and useProducts
- Payment has a 20% random failure rate for demo purposes (configurable in `src/app/api/checkout/route.ts`)
- Product images are SVGs in `public/images/`
- Mock payment token hardcoded in useCheckout initial state

## User Preferences
- Harry prefers concise responses, no trailing summaries
- TypeScript is a growth area — learning comments in code are intentional and helpful
- Prefers practical fixes over over-engineered solutions
