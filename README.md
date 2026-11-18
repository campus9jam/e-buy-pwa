# E-Buy PWA — Bike & Phone Financing Platform

A lean, serverless Progressive Web App for bike and phone financing with role-based access, Monnify bank transfer payments, and admin inventory management.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Turso (libsql/SQLite at the edge) — free tier includes 500 databases
- **Auth**: Firebase Google sign-in (admin) + JWT sessions, plus email/password admin login
- **PWA**: Web App Manifest (installable on mobile/desktop)
- **Deployment**: Vercel (zero-config) with GitHub Actions CI

## Pricing Rules

All pricing lives in `lib/pricing.ts` and is the single source of truth for the landing page, checkout, order API, admin portal and confirmation page.

Products carry a `category` (`bike` or `phone`), and the two categories have different deposit rules.

| Rule | Bikes | Phones |
|---|---|---|
| Registration fee | **₦50,000** | — |
| VAT | **₦10,000** flat | **₦10,000** flat |
| First payment | **₦240,000** | **20%** of price |
| Due at checkout | **₦300,000** flat (registration + VAT + first payment) | down payment + VAT |
| Remaining balance | price − ₦240,000, paid in installments after delivery | 80% of price, paid in installments after delivery |
| Guarantors required | **3**, each with name, phone and address | **3**, each with name, phone and address |

Existing catalogue rows default to `phone`; the admin inventory form sets the category on new products. The order API recomputes these amounts server-side from the stored price and category, so a tampered client cannot change what is recorded.

## Quick Start (Local Dev)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Turso credentials (or use local SQLite: file:./dev.db)

# 3. Seed the database
npm run db:seed

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

### Customer Flow
- Landing page hero slider featuring financed motorcycles, with the current deposit/VAT terms
- Advert banner below the hero, driven by `lib/ads.ts` (default: NNPC engine oil, CTA opens WhatsApp)
- Browse available inventory with a full price breakdown (price, 20% down payment, VAT, due at checkout, remaining balance)
- Click "Buy Now" to start checkout
- Fill KYC: full name, phone, NIN, delivery address and **three guarantors** (name, phone, address each)
- View active Monnify bank transfer details
- Upload payment receipt (.jpg/.png/.pdf)
- Submit order and chat with delivery agent on WhatsApp

### Admin Portal
- **Monnify Account Settings**: Update bank name, account number, account name, and agent WhatsApp number dynamically (no redeployment needed)
- **Multi-account rotation**: several collection accounts can be active; checkout rotates through them
- **Inventory Manager**: Add and remove products from the catalog
- **Orders & KYC**: review customer details, all three guarantors, down payment + VAT, and the uploaded receipt

### Auth & Roles
- Simple role-based access (Customer / Admin)
- Admin portal is gated — only admin role can access
- Google sign-in is optional: it is skipped gracefully when `NEXT_PUBLIC_GOOGLE_API_KEY` is not set

## Deploy to Vercel + GitHub

### Step 1: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/e-buy-pwa.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no config needed
4. Add environment variables (see below)
5. Click Deploy

### Step 3: Environment Variables in Vercel

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Turso database URL | `libsql://e-buy-campus9jam.aws-ap-south-1.turso.io` |
| `DATABASE_AUTH_TOKEN` | Turso database auth token | `eyJhbGciOi...` |
| `ADMIN_SECRET` | Shared secret for admin API routes | `your-secure-string` |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Firebase web API key for Google admin sign-in | `AIzaSy...` |

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

1. **Typecheck & build** — `npm ci`, `npm run typecheck`, `npm run build` on Node 20 with a throwaway SQLite URL, so the pipeline needs no secrets.
2. **Post-deploy smoke test** — after a push to `main`, waits for the Vercel deployment and checks that `https://e-buy-pwa.vercel.app` returns 200 and that `/api/devices` returns a JSON array.

Deployment itself is handled by Vercel's Git integration: every push to `main` produces a production build, and pull requests get preview URLs. No deploy token is stored in the repo.

Local equivalents:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run verify      # typecheck + build
```

## Database Migrations

`lib/seed.ts` creates every table and is safe to re-run (`CREATE TABLE IF NOT EXISTS`).

Columns added to the `Order` table after the first release (`vat`, `amountPaid`, `guarantors`, device/payment snapshots) are applied automatically at runtime by `ensureSchema()` in `lib/db.ts`, so an existing production database upgrades itself on the first order request — no manual migration step.

## Turso Database Setup

1. Create a free Turso database at [turso.tech](https://turso.tech)
2. Create a database: `turso db create e-buy`
3. Get the URL: `turso db show e-buy`
4. Create an auth token: `turso db tokens create e-buy`
5. Run the seed: `npm run db:seed`

## Project Structure

```
e-buy-pwa/
├── .github/workflows/ci.yml     # Typecheck, build, post-deploy smoke test
├── app/
│   ├── admin/page.tsx           # Admin dashboard
│   ├── auth/page.tsx            # Sign in / role selection
│   ├── api/
│   │   ├── devices/route.ts     # GET + POST devices
│   │   ├── devices/[id]/route.ts # DELETE product
│   │   ├── orders/route.ts      # POST order, GET orders (admin)
│   │   └── settings/route.ts    # GET + PUT payment settings
│   ├── checkout/page.tsx        # KYC + guarantors + Monnify payment + receipt upload
│   ├── success/page.tsx         # Order confirmation + WhatsApp link
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing / shop catalog
├── components/
│   ├── AdvertBanner.tsx         # Homepage advert slot (NNPC engine oil by default)
│   ├── Header.tsx               # Shared navigation bar
│   └── HeroSlider.tsx           # Motorcycle hero carousel
├── lib/
│   ├── ads.ts                   # Homepage advert definitions + default ad
│   ├── db.ts                    # libsql client + lazy schema upgrades
│   ├── pricing.ts               # Down payment, VAT and balance rules
│   └── seed.ts                  # Seed script (tables, products, settings)
├── public/
│   ├── ads/                     # Advert creative (NNPC engine oil)
│   ├── hero/                    # Hero motorcycle slides
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # App icons
├── .env.example
└── package.json
```

## PWA Installation

The app is installable on mobile and desktop:
- **Mobile (Chrome/Edge)**: Open the URL → browser menu → "Add to Home Screen"
- **Desktop (Chrome/Edge)**: Click the install icon in the address bar

## License

MIT — Built for E-Buy.
