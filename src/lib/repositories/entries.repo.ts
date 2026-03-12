import { query } from "@/lib/db";
import type { ManualEntry } from "@/types/finance";

function n(v: unknown): number {
  if (v == null) return 0;
  const num = typeof v === "number" ? v : Number(v);
  return Number.isFinite(num) ? num : 0;
}

export async function insertManualEntry(input: {
  type: string;
  amount: number;
  description?: string | null;
  createdBy: string;
}) {
  const res = await query<{
    id: number;
    type: string;
    amount: string | number;
    description: string | null;
    created_by: string;
    created_at: string;
  }>(
    `
    insert into manual_entries (type, amount, description, created_by)
    values ($1, $2, $3, $4)
    returning id, type, amount, description, created_by, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as created_at
    `,
    [input.type, input.amount, input.description ?? null, input.createdBy],
  );

  const r = res.rows[0]!;
  return {
    id: r.id,
    type: r.type,
    amount: n(r.amount),
    description: r.description,
    createdBy: r.created_by,
    createdAt: r.created_at,
  } satisfies ManualEntry;
}

export async function listManualEntries(opts: { limit: number }) {
  const limit = Math.min(200, Math.max(1, opts.limit));
  const res = await query<{
    id: number;
    type: string;
    amount: string | number;
    description: string | null;
    created_by: string;
    created_at: string;
  }>(
    `
    select id, type, amount, description, created_by,
      to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') as created_at
    from manual_entries
    order by created_at desc, id desc
    limit $1
    `,
    [limit],
  );

  return res.rows.map(
    (r) =>
      ({
        id: r.id,
        type: r.type,
        amount: n(r.amount),
        description: r.description,
        createdBy: r.created_by,
        createdAt: r.created_at,
      }) satisfies ManualEntry,
  );
}
