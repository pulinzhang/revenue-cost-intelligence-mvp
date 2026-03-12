-- Sample seed data for Revenue & Cost Intelligence (PostgreSQL / Supabase)
-- Usage (Supabase SQL editor or psql):
--   Run this file. It will wipe existing data in these tables by default.
--
-- Notes:
-- - Generates:
--   - 12 users (2 admins + 10 local users)
--   - 50,000 transactions (~2 years, 50 shops, 6 regions, 40 products)
--   - 5,000 manual_entries linked to existing users

BEGIN;

-- Optional: wipe existing data (keeps schema intact)
TRUNCATE TABLE manual_entries RESTART IDENTITY;
TRUNCATE TABLE transactions RESTART IDENTITY;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Ensure crypto extension exists (uuid generation)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Users
INSERT INTO users (email, password_hash, provider, role)
VALUES
  ('admin1@example.com', NULL, 'azure', 'admin'),
  -- Local admin for credentials login (password: admin123)
  ('admin2@example.com', crypt('admin123', gen_salt('bf', 12)), 'local', 'admin');

-- 10 normal users
INSERT INTO users (email, password_hash, provider, role)
SELECT
  format('user%02s@example.com', i) AS email,
  -- password: user123
  crypt('user123', gen_salt('bf', 12)) AS password_hash,
  'local' AS provider,
  'user' AS role
FROM generate_series(1, 10) AS i;

-- 2) Transactions (50,000 rows)
-- Distributions:
-- - date: last ~730 days
-- - shop_id: SHOP-001..SHOP-050
-- - region: 6 regions
-- - product: SKU-001..SKU-040
-- - revenue/fixed/variable: realistic-ish ranges, with some variability by shop/region/product
WITH
regions AS (
  SELECT unnest(ARRAY['NA','EU','APAC','LATAM','MEA','ANZ']) AS region, row_number() OVER () AS rnk
),
shops AS (
  SELECT format('SHOP-%03s', s) AS shop_id, s AS shop_n
  FROM generate_series(1, 50) AS s
),
products AS (
  SELECT format('SKU-%03s', p) AS product, p AS prod_n
  FROM generate_series(1, 40) AS p
)
INSERT INTO transactions (date, shop_id, region, product, revenue, fixed_cost, variable_cost)
SELECT
  (current_date - (gs % 730))::date AS date,
  sh.shop_id,
  rg.region,
  pr.product,
  -- revenue: base 100..2000 with multipliers; rounded to cents
  round((
    (100 + (gs % 1901))::numeric
    * (0.85 + (sh.shop_n % 10) * 0.03)
    * (0.90 + (rg.rnk % 6) * 0.02)
    * (0.80 + (pr.prod_n % 8) * 0.05)
  )::numeric, 2) AS revenue,
  -- fixed_cost: base 20..300 with shop/region effects
  round((
    (20 + (gs % 281))::numeric
    * (0.95 + (sh.shop_n % 7) * 0.04)
    * (0.95 + (rg.rnk % 5) * 0.03)
  )::numeric, 2) AS fixed_cost,
  -- variable_cost: 25%..75% of revenue-ish, product-dependent
  round((
    (
      (100 + (gs % 1901))::numeric
      * (0.85 + (sh.shop_n % 10) * 0.03)
      * (0.90 + (rg.rnk % 6) * 0.02)
      * (0.80 + (pr.prod_n % 8) * 0.05)
    )
    * (0.25 + (pr.prod_n % 9) * 0.05)
  )::numeric, 2) AS variable_cost
FROM generate_series(1, 50000) AS gs
JOIN shops sh ON sh.shop_n = ((gs - 1) % 50) + 1
JOIN regions rg ON rg.rnk = ((gs - 1) % 6) + 1
JOIN products pr ON pr.prod_n = ((gs - 1) % 40) + 1;

-- 3) Manual entries (5,000 rows)
-- Types: rent, salary, marketing, refund, adjustment
WITH
u AS (
  SELECT id, row_number() OVER (ORDER BY created_at, email) AS rn
  FROM users
),
types AS (
  SELECT unnest(ARRAY['rent','salary','marketing','refund','adjustment']) AS type, row_number() OVER () AS tnk
)
INSERT INTO manual_entries (type, amount, description, created_by, created_at)
SELECT
  tp.type,
  round((
    -- amount 10..5000 with some type-specific scaling
    (10 + (gs % 4991))::numeric
    * CASE tp.type
        WHEN 'rent' THEN 1.2
        WHEN 'salary' THEN 1.8
        WHEN 'marketing' THEN 1.0
        WHEN 'refund' THEN -0.6
        ELSE 0.8
      END
  )::numeric, 2) AS amount,
  format('seed %s entry #%s', tp.type, gs) AS description,
  (SELECT id FROM u WHERE rn = ((gs - 1) % (SELECT count(*) FROM u)) + 1) AS created_by,
  now() - make_interval(days => (gs % 180), mins => (gs % 1440)) AS created_at
FROM generate_series(1, 5000) AS gs
JOIN types tp ON tp.tnk = ((gs - 1) % 5) + 1;

COMMIT;

