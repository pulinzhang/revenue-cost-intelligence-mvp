# Revenue & Cost Intelligence Platform (MVP)

Monolithic full-stack **Next.js (App Router)** MVP for revenue/cost analytics and manual financial entries.

## Contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick start (local)](#quick-start-local)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Routes](#routes)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Code quality](#code-quality)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Tech stack

| Layer | Technology | Description |
|-------|------------|-------------|
| Framework | Next.js 16 (App Router) | React-based full-stack framework |
| Styling | Tailwind CSS 4 | Utility-first CSS framework |
| Authentication | next-auth v4 | Azure AD SSO + local email/password |
| Database | PostgreSQL + `pg` library | Supabase hosted PostgreSQL |
| Charts | Recharts | React-based charting library |
| Data Grid | AG Grid Community | Enterprise-grade data table |
| Validation | Zod | TypeScript-first schema validation |
| Deployment | Cloudflare Workers | Edge deployment via @opennextjs/cloudflare |

## Features

- **Dashboard**: KPI summary cards (total revenue, total cost, profit margin) + revenue/cost trend charts
- **Finance Table**: Paginated financial detail list with sorting and filtering
- **Entries Management**: Manual financial entry creation and listing
- **Authentication**: 
  - Local email/password registration and login
  - Azure AD SSO (optional enterprise feature)
- **Route Protection**: All app routes protected via server-side middleware

## Prerequisites

- **Node.js** 18.x or later
- **npm** 10.x or later
- **PostgreSQL** database (Supabase recommended)
- **Supabase account** (free tier works)

## Quick start (local)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your values:

```bash
cp env.example .env.local
```

See [Environment variables](#environment-variables) section for detailed configuration.

### 3. Set up database

Run the schema creation script against your Supabase PostgreSQL database:

```bash
# Option 1: Using Supabase SQL Editor
# Copy and paste sql/schema.sql content into https://supabase.com/dashboard/<project>/sql

# Option 2: Using psql CLI
psql $DATABASE_URL -f sql/schema.sql
```

### 4. (Optional) Load sample data

```bash
psql $DATABASE_URL -f sql/seed.sample-data.sql
```

### 5. Start development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db?sslmode=require`) |
| `AUTH_SECRET` | Yes | Random string for NextAuth.js session encryption (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | No | Production URL for NextAuth (defaults to `http://localhost:3000`) |
| `AZURE_AD_CLIENT_ID` | No | Azure Active Directory app client ID |
| `AZURE_AD_CLIENT_SECRET` | No | Azure Active Directory app client secret |
| `AZURE_AD_TENANT_ID` | No | Azure Active Directory tenant ID |

### Example .env.local

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.abc123.supabase.co:5432/postgres?sslmode=require"

# Auth
AUTH_SECRET="your-random-secret-here-generated-by-openssl"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD (optional)
# AZURE_AD_CLIENT_ID="your-azure-client-id"
# AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
# AZURE_AD_TENANT_ID="your-azure-tenant-id"
```

## Database Setup

### Schema Overview

The database schema (`sql/schema.sql`) creates the following tables:

```sql
-- Users table (extends NextAuth)
users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),        -- NULL for OAuth users
  name            VARCHAR(255),
  role            VARCHAR(50) DEFAULT 'user',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Financial entries (manual entries)
financial_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  type            VARCHAR(20) NOT NULL,    -- 'revenue' or 'cost'
  amount          DECIMAL(15,2) NOT NULL,
  category        VARCHAR(100),
  description     TEXT,
  entry_date      DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Indexes for performance
CREATE INDEX idx_financial_entries_user ON financial_entries(user_id);
CREATE INDEX idx_financial_entries_date ON financial_entries(entry_date);
CREATE INDEX idx_financial_entries_type ON financial_entries(type);
```

### Running migrations

```bash
# Create tables
psql $DATABASE_URL -f sql/schema.sql

# Seed sample data (optional)
psql $DATABASE_URL -f sql/seed.sample-data.sql
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Pages      │  │  API Routes │  │ Middleware  │         │
│  │  (React)    │  │  (Handlers) │  │ (Protection)│         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  src/lib/services/  - Domain logic orchestration    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  src/lib/repositories/ - Transactional CRUD        │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  src/lib/queries/    - Read/reporting SQL helpers  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Supabase)                      │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Pages | `src/app/(app)/*` | UI rendering, client-side state |
| API Routes | `src/app/api/*` | HTTP request handling, input validation |
| Services | `src/lib/services/*` | Business logic, orchestration |
| Repositories | `src/lib/repositories/*` | Transactional DB operations (insert/update/delete) |
| Queries | `src/lib/queries/*` | Read-only DB queries, aggregations |

## Project Structure

```
.
├─ docs/
│  └─ tech-require.md              # Requirements and technical notes
├─ public/                         # Static assets (images, fonts, etc.)
├─ sql/
│  ├─ schema.sql                   # Database schema (tables, indexes)
│  └─ seed.sample-data.sql         # Sample data for testing
├─ scripts/
│  └─ test-db-connection.js        # Database connection test script
├─ src/
│  ├─ app/                         # Next.js App Router
│  │  ├─ (app)/                   # Authenticated app pages
│  │  │  ├─ dashboard/
│  │  │  │  └─ page.tsx          # Dashboard with KPIs and charts
│  │  │  ├─ entries/
│  │  │  │  └─ page.tsx          # Manual entries management
│  │  │  ├─ finance/
│  │  │  │  └─ page.tsx          # Financial data grid
│  │  │  └─ layout.tsx           # Authenticated layout wrapper
│  │  ├─ api/                     # API Route Handlers
│  │  │  ├─ auth/
│  │  │  │  ├─ [...nextauth]/    # NextAuth.js handlers
│  │  │  │  └─ register/         # Local user registration
│  │  │  ├─ dashboard/
│  │  │  │  ├─ summary/         # KPI summary endpoint
│  │  │  │  └─ trends/          # Chart data endpoint
│  │  │  ├─ entries/
│  │  │  │  ├─ create/          # Create entry endpoint
│  │  │  │  └─ list/            # List entries endpoint
│  │  │  └─ finance/
│  │  │     └─ list/            # Paginated finance list
│  │  ├─ login/                  # Login page
│  │  ├─ layout.tsx              # Root layout
│  │  └─ page.tsx                # Landing page (/)
│  ├─ components/                 # Reusable UI components
│  │  ├─ charts/                 # Chart components (Recharts)
│  │  ├─ ui/                     # Basic UI components
│  │  └─ ...                     # Feature-specific components
│  ├─ lib/
│  │  ├─ auth.ts                # NextAuth configuration
│  │  ├─ db.ts                  # PostgreSQL connection pool
│  │  ├─ env.ts                 # Environment variable validation
│  │  ├─ errors.ts              # Error handling utilities
│  │  ├─ queries/               # Read-only SQL queries
│  │  │  ├─ dashboard.ts        # Dashboard aggregations
│  │  │  └─ finance.ts          # Finance report queries
│  │  ├─ repositories/          # Transactional operations
│  │  │  ├─ user.repository.ts  # User CRUD
│  │  │  └─ entry.repository.ts # Entry CRUD
│  │  ├─ services/              # Business logic
│  │  └─ validators/           # Zod schemas for validation
│  ├─ types/                    # TypeScript type definitions
│  └─ proxy.ts                 # Route protection middleware
├─ .env.example                # Environment variable template
├─ .eslint.config.mjs         # ESLint configuration
├─ next.config.ts              # Next.js configuration
├─ wrangler.toml              # Cloudflare Workers config
├─ open-next.config.ts        # OpenNext Cloudflare adapter config
└─ package.json               # Dependencies and scripts
```

## Routes

### Pages

| Path | Description | Auth Required |
|------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | Sign in / register page | No |
| `/dashboard` | KPI summary + trend charts | Yes |
| `/finance` | Financial data grid (paginated) | Yes |
| `/entries` | Manual entries management | Yes |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/summary` | Get KPI summary (total revenue, cost, count) |
| GET | `/api/dashboard/trends` | Get revenue/cost trends for charts |
| GET | `/api/finance/list` | Get paginated financial entries |
| POST | `/api/entries/create` | Create new manual entry |
| GET | `/api/entries/list` | List manual entries with filters |

## API Reference

### GET /api/dashboard/summary

Returns KPI summary for the authenticated user.

**Query Parameters**: None (uses session user)

**Response**:
```json
{
  "totalRevenue": 125000.00,
  "totalCost": 85000.00,
  "profit": 40000.00,
  "profitMargin": 32.0,
  "entryCount": 156
}
```

### GET /api/dashboard/trends

Returns revenue and cost trends for charting.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | 'weekly' \| 'monthly' (default: 'monthly') |
| months | number | Number of months to look back (default: 6) |

**Response**:
```json
{
  "trends": [
    { "period": "2024-01", "revenue": 20000, "cost": 15000 },
    { "period": "2024-02", "revenue": 25000, "cost": 18000 }
  ]
}
```

### GET /api/finance/list

Returns paginated financial entries.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 50 | Items per page |
| type | string | - | Filter by 'revenue' or 'cost' |
| startDate | string | - | Filter start date (YYYY-MM-DD) |
| endDate | string | - | Filter end date (YYYY-MM-DD) |
| sortBy | string | 'entry_date' | Sort field |
| sortOrder | string | 'desc' | 'asc' or 'desc' |

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "revenue",
      "amount": 5000.00,
      "category": "Sales",
      "description": "Q1 invoice",
      "entry_date": "2024-01-15",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 156,
    "totalPages": 4
  }
}
```

### POST /api/entries/create

Create a new manual financial entry.

**Request Body**:
```json
{
  "type": "revenue",
  "amount": 5000.00,
  "category": "Sales",
  "description": "Q1 invoice payment",
  "entryDate": "2024-01-15"
}
```

**Response**:
```json
{
  "id": "uuid",
  "message": "Entry created successfully"
}
```

## Authentication

### Local Email/Password

1. Navigate to `/login`
2. Click "Register" to create an account
3. Enter email and password
4. Click "Sign in"

### Azure AD SSO (Optional)

1. Configure Azure AD environment variables
2. Click "Sign in with Microsoft" on login page
3. Complete Microsoft OAuth flow

### Test Accounts

If you ran `sql/seed.sample-data.sql`, you can use:

- **Email**: `admin2@example.com`
- **Password**: `admin123`

## Code Quality

### Linting

```bash
npm run lint
```

### Auto-fix Lint Issues

```bash
npm run lint:fix
```

### Formatting (Prettier)

Check formatting:
```bash
npm run format:check
```

Apply formatting:
```bash
npm run format
```

### Type Checking

```bash
# Using Next.js build (includes type checking)
npm run build

# Fast local check
npx tsc --noEmit
```

## Deployment

### Supabase PostgreSQL Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database**
3. Find your connection string under **Connection string**
4. Add `?sslmode=require` to the URI
5. Run `sql/schema.sql` in the Supabase SQL Editor

### Cloudflare Workers (Recommended)

This project uses `@opennextjs/cloudflare` for edge deployment.

```bash
# Build and deploy
npm run deploy
```

Or preview locally:

```bash
npm run preview
```

### Environment Variables in Production

Set the same environment variables in your deployment platform:

| Platform | How to set |
|----------|------------|
| Cloudflare Workers | wrangler secret put DATABASE_URL |
| Azure App Service | Configuration → Application settings |
| Vercel | Project Settings → Environment Variables |

## Troubleshooting

### Database Connection Issues

Run the connection test script:

```bash
node scripts/test-db-connection.js
```

**Common issues:**
- `DATABASE_URL` incorrect → Check Supabase dashboard connection string
- SSL required → Ensure URL ends with `?sslmode=require`
- Project paused → Restore project in Supabase dashboard

### Authentication Issues

- **Session expired**: Clear browser cookies and log in again
- **OAuth errors**: Verify Azure AD credentials are correct
- **Password reset**: Currently not implemented (MVP limitation)

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Or use a different port:
```bash
npm run dev -- -p 3001
```

## License

MIT
