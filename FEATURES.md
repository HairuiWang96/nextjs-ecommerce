# Feature Summary

## Basic Features (branch: `basic`)

### Product Catalog
- Product listing with grid layout, search, and pagination
- Product cards with variant selector (size/color), quantity picker, add-to-cart
- SVG product illustrations for 4 demo products
- API: `GET /api/products` (pagination, search, category filter), `GET/PUT/DELETE /api/products/[id]`

### Shopping Cart
- Add/remove items, update quantities
- Cart badge in navbar showing item count
- Product images displayed in cart
- Cart totals: subtotal, tax, total
- API: `GET /api/cart`, `POST /api/cart` (add item), `PUT /api/cart` (update quantity)

### Checkout Flow
- Multi-step form: Shipping → Payment → Review → Processing → Complete
- Mock payment with credit card / PayPal / bank transfer options
- Order confirmation page with order details
- API: `POST /api/checkout`

### TypeScript Patterns (with learning comments throughout)
- **Generics**: `ApiResponse<T>`, `PaginatedResponse<T>`, typed fetch wrapper
- **Discriminated unions**: Payment types, order status, API responses
- **Type guards**: `isApiSuccess()`, `isPaymentSuccess()`, `isInStock()`
- **Utility types**: `Partial`, `Pick`, `Omit` for input/update types
- **`as const` objects**: Used instead of enums for OrderStatus, CheckoutStep
- **Indexed access types**: Deriving types from existing ones

### Architecture
- Next.js App Router with `"use client"` directive
- In-memory data store simulating a database
- React Context API for cart state management
- Custom hooks: `useProducts`, `useCart`, `useCheckout`
- Typed API client with generic fetch wrapper

---

## New Features (branch: `feature/realistic-ecommerce`)

### 1. Inventory Reservation + Race Condition Protection
- `reserveInventory(items)` checks and deducts stock atomically
- `releaseInventory(items)` rolls back on payment failure
- Optimistic locking prevents overselling
- Stock re-validated at checkout time (not just add-to-cart)
- **Pattern**: Saga — reserve → charge → rollback on failure

### 2. Idempotency Keys (Prevent Double Charges)
- Client generates a UUID idempotency key per checkout attempt
- Server caches `Idempotency-Key → Order` mapping
- Duplicate requests return the cached order instead of charging again
- Key stored via `useRef` (persists across renders without re-render)
- Retry generates a new key (old attempt may be cached as failed)

### 3. Promo Codes / Dynamic Pricing
- 4 promo codes: `SAVE10` (10% off), `SAVE20` (20% off), `FLAT5` ($5 off), `FREESHIP` (free shipping)
- `POST /api/cart/promo` to validate and apply, `DELETE` to remove
- Cart totals recalculated with discount applied
- UI: promo code input with Apply/Remove, shows discount in totals
- Discriminated union for discount types (percentage vs fixed vs shipping)

### 4. Field-Level Form Validation
- Each field validates on blur (immediate feedback)
- Red border + error message on invalid fields
- `validateField(field)` for single field, `validateShippingForm()` for all
- Validators: required fields, email format, US zip code format
- Errors stored as `Record<string, string>` — empty = no errors

### 5. Payment Retry with Exponential Backoff
- 20% random payment failure rate (simulates real-world flakiness)
- Server retries up to 3 times with exponential backoff (200ms → 400ms → 800ms)
- Frontend shows attempt count during processing
- On final failure, user sees "Retry Payment" button

### 6. Checkout Failure Recovery
- Payment failure preserves the cart (no data loss)
- User can go "Back to Review" or "Retry Payment" from error state
- Retry uses a new idempotency key (old one may be cached as in-progress)
- Attempt counter shown on both processing and error screens
- Full reset available to start checkout over

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── products/       # Product CRUD
│   │   ├── cart/           # Cart operations + promo codes
│   │   └── checkout/       # Order submission (saga pattern)
│   ├── cart/               # Cart page
│   ├── checkout/           # Checkout page
│   └── page.tsx            # Home (product listing)
├── components/             # React components
│   ├── ProductList.tsx     # Product grid with search/pagination
│   ├── ProductCard.tsx     # Product display with variant picker
│   ├── Cart.tsx            # Cart with promo code UI
│   ├── CheckoutForm.tsx    # Multi-step checkout form
│   └── OrderSummary.tsx    # Order confirmation
├── context/
│   └── CartContext.tsx      # Cart state via React Context
├── hooks/
│   ├── useProducts.ts      # Product fetching hook
│   ├── useCart.ts           # Cart context consumer
│   └── useCheckout.ts      # Checkout state machine
├── lib/
│   ├── store.ts            # In-memory data store
│   ├── api-client.ts       # Typed fetch wrapper
│   ├── validators.ts       # Input validation utilities
│   └── formatters.ts       # Currency, date, string formatters
├── types/
│   ├── product.ts          # Product types + type guards
│   ├── cart.ts             # Cart types + discount union
│   ├── order.ts            # Order types + payment union
│   ├── api.ts              # Generic API response types
│   └── index.ts            # Barrel export
└── public/images/          # SVG product illustrations
```

## Design Decisions
- **Why idempotency?** Prevents double charges on network retry or double-click
- **Why saga pattern?** Ensures inventory is released if payment fails — no "ghost reservations"
- **Why discriminated unions?** TypeScript narrows the type after a switch/if check — safer than string checks
- **Why `as const` over enums?** Better tree-shaking, works with plain objects, no runtime code generated
- **Why `useRef` for idempotency key?** Persists across renders without triggering re-renders (unlike `useState`)
- **Why field-level validation on blur?** Better UX than submit-only validation — user gets feedback immediately
