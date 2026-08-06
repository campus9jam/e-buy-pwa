# E-Buy PWA — Device Financing Platform

A lean, serverless Progressive Web App for device financing with role-based access, Monnify bank transfer payments, and admin inventory management.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Turso (libsql/SQLite at the edge) — free tier includes 500 databases
- **PWA**: Web App Manifest (installable on mobile/desktop)
- **Deployment**: Vercel (zero-config)

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
- Browse available device inventory
- Click "Buy Now" to start checkout
- Fill KYC form (name, phone, BVN)
- View active Monnify bank transfer details
- Upload payment receipt (.jpg/.png/.pdf)
- Submit order and chat with delivery agent on WhatsApp

### Admin Portal
- **Monnify Account Settings**: Update bank name, account number, account name, and agent WhatsApp number dynamically (no redeployment needed)
- **Inventory Manager**: Add and remove devices from the catalog

### Auth & Roles
- Simple role-based access (Customer / Admin)
- Admin portal is gated — only admin role can access

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

## Turso Database Setup

1. Create a free Turso database at [turso.tech](https://turso.tech)
2. Create a database: `turso db create e-buy`
3. Get the URL: `turso db show e-buy`
4. Create an auth token: `turso db tokens create e-buy`
5. Run the seed: `npm run db:seed`

## Project Structure

```
e-buy-pwa/
├── app/
│   ├── admin/page.tsx           # Admin dashboard
│   ├── auth/page.tsx            # Sign in / role selection
│   ├── api/
│   │   ├── devices/route.ts     # GET + POST devices
│   │   ├── devices/[id]/route.ts # DELETE device
│   │   ├── orders/route.ts      # POST order, GET orders (admin)
│   │   └── settings/route.ts    # GET + PUT payment settings
│   ├── checkout/page.tsx        # KYC + Monnify payment + receipt upload
│   ├── success/page.tsx         # Order confirmation + WhatsApp link
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing / shop catalog
├── components/
│   └── Header.tsx               # Shared navigation bar
├── lib/
│   ├── db.ts                    # libsql database client
│   └── seed.ts                  # Seed script (devices + settings)
├── public/
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
