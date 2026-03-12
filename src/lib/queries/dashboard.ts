import { query } from "@/lib/db";
import { buildWhere, type CommonFilters } from "@/lib/queries/filters";
import type { DashboardSummary, TrendPoint } from "@/types/dashboard";

function n(v: unknown): number {
  if (v == null) return 0;
  const num = typeof v === "number" ? v : Number(v);
  return Number.isFinite(num) ? num : 0;
}

export async function getDashboardSummary(filters: CommonFilters): Promise<DashboardSummary> {
  const { where, params } = buildWhere(filters);

  const res = await query<{
    total_revenue: string | number | null;
    fixed_cost: string | number | null;
    variable_cost: string | number | null;
  }>(
    `
    select
      coalesce(sum(revenue), 0) as total_revenue,
      coalesce(sum(fixed_cost), 0) as fixed_cost,
      coalesce(sum(variable_cost), 0) as variable_cost
    from transactions
    ${where}
    `,
    params,
  );

  const row = res.rows[0] ?? { total_revenue: 0, fixed_cost: 0, variable_cost: 0 };
  const totalRevenue = n(row.total_revenue);
  const fixedCost = n(row.fixed_cost);
  const variableCost = n(row.variable_cost);
  const totalCost = fixedCost + variableCost;
  const grossMargin = totalRevenue - totalCost;
  const grossMarginPct = totalRevenue > 0 ? grossMargin / totalRevenue : null;

  const variableCostRatio = totalRevenue > 0 ? variableCost / totalRevenue : null;
  const breakEvenPoint =
    variableCostRatio == null || variableCostRatio >= 1
      ? null
      : fixedCost / (1 - variableCostRatio);

  return {
    totalRevenue,
    totalCost,
    grossMargin,
    grossMarginPct,
    fixedCost,
    variableCost,
    breakEvenPoint,
  };
}

export async function getRevenueCostTrends(filters: CommonFilters): Promise<TrendPoint[]> {
  const { where, params } = buildWhere(filters);
  const res = await query<{
    month: string;
    revenue: string | number | null;
    total_cost: string | number | null;
  }>(
    `
    select
      to_char(date_trunc('month', date), 'YYYY-MM-01') as month,
      coalesce(sum(revenue), 0) as revenue,
      coalesce(sum(fixed_cost + variable_cost), 0) as total_cost
    from transactions
    ${where}
    group by 1
    order by 1 asc
    `,
    params,
  );

  return res.rows.map((r) => ({
    month: r.month,
    revenue: n(r.revenue),
    totalCost: n(r.total_cost),
  }));
}
