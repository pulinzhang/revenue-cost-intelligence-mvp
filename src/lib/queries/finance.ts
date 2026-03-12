import { query } from "@/lib/db";
import { buildWhere, type CommonFilters } from "@/lib/queries/filters";
import type { FinanceRow } from "@/types/finance";

function n(v: unknown): number {
  if (v == null) return 0;
  const num = typeof v === "number" ? v : Number(v);
  return Number.isFinite(num) ? num : 0;
}

export async function listFinanceRows(opts: CommonFilters & { page: number; pageSize: number }) {
  const page = Math.max(1, opts.page);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize));
  const offset = (page - 1) * pageSize;

  const { where, params } = buildWhere(opts);
  const paramsWithPaging = [...params, pageSize, offset];

  const dataRes = await query<{
    id: number;
    date: string;
    shop_id: string;
    region: string;
    product: string | null;
    revenue: string | number | null;
    fixed_cost: string | number | null;
    variable_cost: string | number | null;
  }>(
    `
    select id, to_char(date, 'YYYY-MM-DD') as date, shop_id, region, product, revenue, fixed_cost, variable_cost
    from transactions
    ${where}
    order by date desc, id desc
    limit $${params.length + 1}
    offset $${params.length + 2}
    `,
    paramsWithPaging,
  );

  const countRes = await query<{ count: string }>(
    `
    select count(*)::text as count
    from transactions
    ${where}
    `,
    params,
  );

  const rows: FinanceRow[] = dataRes.rows.map((r) => {
    const revenue = n(r.revenue);
    const fixedCost = n(r.fixed_cost);
    const variableCost = n(r.variable_cost);
    const totalCost = fixedCost + variableCost;
    const grossMargin = revenue - totalCost;
    return {
      id: r.id,
      date: r.date,
      shopId: r.shop_id,
      region: r.region,
      product: r.product,
      revenue,
      fixedCost,
      variableCost,
      totalCost,
      grossMargin,
    };
  });

  return { rows, totalCount: Number(countRes.rows[0]?.count ?? "0"), page, pageSize };
}
