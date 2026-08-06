# E-Buy PWA — Device Financing Platform

A lean, serverless Progressive Web App for device financing with role-based access, Monnify bank transfer payments, and admin inventory management.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM + SQLite (dev) / Turso (prod)
- **PWA**: Web App Manifest (installable on mobile/desktop)
- **Deployment**: Vercel (zero-config)

## Quick Start (Local Dev)

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
cp .env.example .env
npx prisma db push
npx tsx lib/seed.ts

# 3. Run the dev server
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
git init
git add .
git commit -m "Initial E-Buy PWA"
git remote add origin https://github.com/YOUR_USERNAME/e-buy-pwa.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no config needed
4. Add environment variables (see below)
5. Click Deploy

### Step 3: Set Up Production Database (Turso)

1. Create a free Turso database at [turso.tech](https://turso.tech)
2. Get your database URL and auth token
3. Add these as Vercel environment variables:
   - `DATABASE_URL` = `libsql://your-db.turso.io`
   - `DATABASE_AUTH_TOKEN` = `your-token`
   - `ADMIN_SECRET` = `a-secure-random-string`

4. Run the schema on Turso:
```bash
npx prisma db push
npx tsx lib/seed.ts
```

> **Note**: For Turso, update `prisma/schema.prisma` datasource to use the libsql adapter, or use a Prisma version that supports libsql natively. Alternatively, use Neon (PostgreSQL) by changing the provider to `"postgresql"`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `DATABASE_AUTH_TOKEN` | Turso auth token (prod only) | — |
| `ADMIN_SECRET` | Shared secret for admin API routes | `change-me-in-production` |

## Project Structure

```
e-buy-pwa/
├── app/
│   ├── admin/page.tsx          # Admin dashboard
│   ├── auth/page.tsx           # Sign in / role selection
│   ├── api/
│   │   ├── devices/route.ts    # GET + POST devices
│   │   ├── devices/[id]/route.ts # DELETE device
│   │   ├── orders/route.ts    # POST order, GET orders (admin)
│   │   └── settings/route.ts  # GET + PUT payment settings
│   ├── checkout/page.tsx       # KYC + Monnify payment + receipt upload
│   ├── success/page.tsx        # Order confirmation + WhatsApp link
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Landing / shop catalog
├── components/
│   └── Header.tsx              # Shared navigation bar
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   └── seed.ts                 # Seed script (devices + settings)
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                  # App icons (add icon-192.png, icon-512.png)
├── .env.example
└── package.json
```

## PWA Installation

The app is installable on mobile and desktop:
- **Mobile (Chrome/Edge)**: Open the URL → browser menu → "Add to Home Screen"
- **Desktop (Chrome/Edge)**: Click the install icon in the address bar

Add `icon-192.png` and `icon-512.png` to `public/icons/` for proper home screen icons.

## License

MIT — Built for E-Buy.
