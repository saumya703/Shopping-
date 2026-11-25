# DIYA Jewellery Demo Store

A responsive Angular 21 jewellery storefront with a local product catalogue, cart, wishlist, checkout demonstration, customer account flows, order tracking, admin tools, and a configurable AI proxy boundary.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`. Run `npm run build` for a production build and `npm test -- --watch=false` for the unit tests.

## Main areas

- `src/app/components/header/` — responsive navigation, search, sign-in/account link, and live cart/wishlist counts.
- `src/app/components/auth-page/` and `src/app/services/auth.service.ts` — demo login, signup, reset flows, profile session, and client-side guards.
- `src/app/components/customer-account/` — profile, local addresses, orders, wishlist link, and password demo.
- `src/app/components/order-details/` and `src/app/services/order.service.ts` — saved demo orders, status history, tracking timeline, and cancellation.
- `src/app/components/admin-page/` — demo product/category CRUD, customer list, order status controls, and sales summary.
- `src/app/services/product.service.ts` — default product catalogue with browser-local demo administration.
- `src/app/services/cart.service.ts` and `src/app/services/wishlist.service.ts` — signal-based persistent cart and wishlist state.
- `src/app/services/ai-assistant.service.ts` — local recommendations or an explicitly configured backend proxy.
- `src/app/app.routes.ts` — storefront, account, order, and admin routes.

## Security and demo boundaries

- Authentication, route guards, and the admin panel are **frontend demonstrations only**. They do not authenticate users or enforce authorization securely; use a backend identity provider and server-side authorization for production.
- Passwords are never saved. Login starts a demo profile session, while password reset/change forms only demonstrate the UI flow.
- Basic demo profiles, addresses, cart/wishlist state, product edits, and orders are stored in browser `localStorage`; do not enter sensitive personal data.
- Checkout does not request or process payment information.
- AI recommendations are labelled demo results unless a trusted backend endpoint is configured. Never put an AI provider secret in Angular code.

## Angular concepts used

- **Standalone components and Router:** pages declare their own imports and use route guards for demo navigation.
- **Signals and computed state:** shared services expose reactive customer, cart, wishlist, catalogue, and order state.
- **Reactive Forms:** account, product-management, and checkout forms validate user input before applying demo actions.
- **Interfaces and dependency injection:** models describe products, orders, addresses, and users; injectable services centralize state and operations.
- **Angular control flow:** `@if`, `@for`, and `@switch` render responsive page states and record lists.
