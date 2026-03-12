import { Pool, type QueryResultRow } from "pg";
import { requiredEnv } from "@/lib/env";

declare global {
  var __pgPool: Pool | undefined;
}

function makePool() {
  // Supabase PostgreSQL connection
  // DATABASE_URL should include ?sslmode=require for secure connections
  const databaseUrl = requiredEnv("DATABASE_URL");

  // pg / pg-connection-string may infer SSL behavior from URL params like `sslmode=require`
  // which can override/complicate explicit ssl config. Keep behavior deterministic:
  // strip those params from the connection string and control TLS via `ssl` option.
  const urlForPg = new URL(databaseUrl);
  const sslMode = (urlForPg.searchParams.get("sslmode") || "").toLowerCase();
  const shouldUseSsl =
    sslMode === "require" ||
    sslMode === "prefer" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    urlForPg.hostname.endsWith(".supabase.com") ||
    urlForPg.hostname.endsWith(".supabase.co");

  urlForPg.searchParams.delete("sslmode");
  urlForPg.searchParams.delete("uselibpqcompat");

  return new Pool({
    connectionString: urlForPg.toString(),
    // Supabase pooler frequently hits SELF_SIGNED_CERT_IN_CHAIN in some environments.
    // For app connectivity, we disable cert verification (can be tightened later with a CA).
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool(): Pool {
  // Lazy init so `next build` can run without DATABASE_URL set.
  if (!global.__pgPool) global.__pgPool = makePool();
  return global.__pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}
