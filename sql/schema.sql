-- MVP schema for Revenue & Cost Intelligence

-- UUID generation (Postgres 13+ typically has pgcrypto available)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core transactional facts (pre-built pipeline may already populate this)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  shop_id TEXT NOT NULL,
  region TEXT NOT NULL,
  product TEXT,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  fixed_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  variable_cost NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_region ON transactions(region);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id);

-- Users (local + Azure)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('azure', 'local')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manual entries (data entry module)
CREATE TABLE IF NOT EXISTS manual_entries (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_entries_created_at ON manual_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_entries_created_by ON manual_entries(created_by);

