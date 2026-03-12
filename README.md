# Revenue & Cost Intelligence Platform (MVP)

Monolithic full-stack **Next.js (App Router)** MVP for revenue/cost analytics and manual financial entries.

## Contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Quick start (local)](#quick-start-local)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Routes](#routes)
- [How to check code](#how-to-check-code)
- [Deployment notes (Azure App Service)](#deployment-notes-azure-app-service)

## Tech stack

- **Frontend**: Next.js + React, Tailwind CSS
- **Auth**: `next-auth` (Azure AD SSO + local email/password)
- **Database**: PostgreSQL (`pg`) + raw SQL (Supabase)
- **Charts**: Recharts
- **Data grid**: AG Grid Community

## Features

- **Dashboard**: KPI summary + revenue/cost trends
- **Finance table**: paged financial detail list
- **Entries**: manual entry create + list
- **Route protection**: enforced via `src/proxy.ts` (except `/login` and `api/auth/*`)

## Quick start (local)

1. Install deps

```bash
npm i
```

2. Create env file

- Copy `env.example` to `.env.local` and fill values:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - (optional) Azure AD: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

3. Create tables

Run `sql/schema.sql` against your Supabase PostgreSQL database. You can use the Supabase SQL Editor or any PostgreSQL client.

4. Start dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Architecture

- **UI (App Router pages)**: `src/app/(app)/*`
- **API (Route Handlers)**: `src/app/api/*`
- **Services (domain orchestration)**: `src/lib/services/*`
- **Data access**:
  - **Repositories**: `src/lib/repositories/*` (CRUD / transactional DB access)
  - **Queries**: `src/lib/queries/*` (read/reporting SQL helpers, e.g. dashboard/finance)

## Project structure

```text
.
├─ docs/
│  └─ tech-require.md          # requirements / notes
├─ public/                     # static assets
├─ sql/
│  └─ schema.sql               # PostgreSQL schema (tables/indexes)
├─ src/
│  ├─ app/                     # Next.js App Router
│  │  ├─ (app)/                # authenticated app pages (wrapped by (app)/layout.tsx)
│  │  │  ├─ dashboard/page.tsx  # /dashboard
│  │  │  ├─ entries/page.tsx    # /entries
│  │  │  ├─ finance/page.tsx    # /finance
│  │  │  └─ layout.tsx          # app shell layout
│  │  ├─ api/                  # Route Handlers (API)
│  │  │  ├─ auth/
│  │  │  │  ├─ [...nextauth]/route.ts  # NextAuth handlers
│  │  │  │  └─ register/route.ts       # local email/password registration (MVP)
│  │  │  ├─ dashboard/
│  │  │  │  ├─ summary/route.ts  # KPI summary
│  │  │  │  └─ trends/route.ts   # charts/trends
│  │  │  ├─ entries/
│  │  │  │  ├─ create/route.ts   # create manual entry
│  │  │  │  └─ list/route.ts     # list manual entries
│  │  │  └─ finance/
│  │  │     └─ list/route.ts     # paged finance list
│  │  ├─ login/                # /login (client + page)
│  │  ├─ layout.tsx            # root layout
│  │  └─ page.tsx              # landing (/)
│  ├─ components/              # shared UI components (charts/grid/panels)
│  ├─ lib/
│  │  ├─ auth.ts               # auth helpers + next-auth options
│  │  ├─ db.ts                 # pg pool + query helper
│  │  ├─ env.ts                # env loading/validation
│  │  ├─ errors.ts             # shared error helpers
│  │  ├─ queries/              # read/reporting SQL helpers (dashboard/finance/filters)
│  │  ├─ repositories/         # transactional CRUD (users/entries)
│  │  ├─ services/             # domain services (API calls these)
│  │  └─ validators/           # zod schemas (entry/user)
│  ├─ types/                   # domain types (dashboard/finance/user)
│  └─ proxy.ts                 # route protection
├─ env.example                 # env template
├─ eslint.config.mjs           # ESLint config
├─ next.config.ts              # Next.js config
└─ package.json
```

## Routes

### App routes

- `/login`: sign in (credentials) + optional Azure AD SSO + local register (MVP)
- `/dashboard`: KPI summary + revenue/cost trends
- `/finance`: financial detail table (paged)
- `/entries`: manual entries (create + list)

### API routes

- `GET /api/dashboard/summary`
- `GET /api/dashboard/trends`
- `GET /api/finance/list?page=1&pageSize=50`
- `POST /api/entries/create`
- `GET /api/entries/list?limit=50`

## How to check code

## Test accounts (seed)

If you ran `sql/seed.sample-data.sql`, it creates a local admin user you can sign in with:

- **Email**: `admin2@example.com`
- **Password**: `admin123`

### Lint

```bash
npm run lint
```

Auto-fix what can be fixed:

```bash
npm run lint:fix
```

### Format (Prettier)

Check formatting:

```bash
npm run format:check
```

Write formatting:

```bash
npm run format
```

### Typecheck

Next.js build runs type checking by default:

```bash
npm run build
```

Or run TypeScript directly (fast local check):

```bash
npx tsc --noEmit
```

## Deployment notes

### Supabase PostgreSQL

- Get your connection string from Supabase Dashboard > Settings > Database > Connection string > URI
- The connection string should include `?sslmode=require` for secure connections
- Run `sql/schema.sql` in Supabase SQL Editor to create tables

### Azure App Service (if deploying there)

- Set the same env vars in App Service Configuration.
- Ensure `DATABASE_URL` uses TLS (`sslmode=require`).
- Use a stable `AUTH_SECRET` per environment.
