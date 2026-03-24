# E-Commerce Store

A production-ready e-commerce platform built with Next.js 16, Firebase, and Stripe.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion, Lucide icons
- **State**: Zustand (cart, auth, inventory, orders, settings)
- **Backend**: Firebase Auth, Firestore, Storage, Admin SDK
- **Payments**: Stripe Checkout + Webhooks

## Prerequisites

- Node.js 18+
- Firebase project (Auth, Firestore, Storage)
- Stripe account

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Required variables:
   - `NEXT_PUBLIC_FIREBASE_*` - Firebase client config
   - `FIREBASE_ADMIN_*` - Firebase Admin SDK credentials
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Stripe keys
   - `NEXT_PUBLIC_ADMIN_EMAIL` - Admin email for elevated access

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Verify build**:
   ```bash
   npm run type-check
   npm run lint
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # Server API routes
│   ├── admin/             # Admin dashboard pages
│   └── (public pages)     # Shop, checkout, account, etc.
├── components/            # React components
├── hooks/                 # Zustand stores + domain hooks
├── lib/                   # Firebase, auth, utils
└── types/                 # TypeScript definitions
```

## Key Features

- User authentication (email/password + Google)
- Product catalog with filters
- Shopping cart (persisted)
- Guest checkout + authenticated checkout
- Stripe payment integration
- Order tracking
- Admin dashboard (products, orders, customers, analytics, settings)

## Security

- Firestore security rules enforce admin-only writes
- Storage rules validate file types/sizes
- Stripe webhook signature verification
- Rate limiting on API endpoints (in-memory, for dev)

## Admin Setup

1. Create a user account via `/signup`
2. Add the user's email to `NEXT_PUBLIC_ADMIN_EMAIL` in `.env.local`
3. Manually create an `admins` document in Firestore with the user's UID:
   ```
   Collection: admins
   Document: [user-uid]
   Field: email: "[user-email]"
   ```

## Payment Flow

1. User adds items to cart
2. Checkout page collects shipping info
3. `/api/place-order` creates pending order + Stripe session
4. User redirected to Stripe Checkout
5. Stripe webhook (`/api/webhook`) updates order status
6. Success page verifies session

## Deployment

Recommended: Vercel (with Firebase Admin credentials set in environment variables)

## Known Limitations

- Rate limiting is in-memory (not shared across instances)
- Prisma/PostgreSQL configured but not actively used
- imgbb for media storage (consider Firebase Storage for production)
