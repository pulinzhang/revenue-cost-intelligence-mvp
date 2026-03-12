import { differenceInCalendarDays, parseISO, subDays } from "date-fns";
import { type CommonFilters } from "@/lib/queries/filters";
import { getDashboardSummary, getRevenueCostTrends } from "@/lib/queries/dashboard";

export type FinanceKpis = {
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number | null; // 0..1
};

export type FinanceSummaryResponse = {
  range: { startDate: string; endDate: string };
  previousRange: { startDate: string; endDate: string };
  current: FinanceKpis;
  previous: FinanceKpis;
  growth: {
    revenuePct: number | null;
    costPct: number | null;
    grossProfitPct: number | null;
    profitMarginPctPoints: number | null; // delta in percentage points (0..100)
  };
  trends: { month: string; revenue: number; totalCost: number }[];
};

function pctGrowth(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function toKpis(summary: {
  totalRevenue: number;
  totalCost: number;
  grossMargin: number;
  grossMarginPct: number | null;
}): FinanceKpis {
  return {
    revenue: summary.totalRevenue,
    cost: summary.totalCost,
    grossProfit: summary.grossMargin,
    profitMargin: summary.grossMarginPct,
  };
}

export async function fetchFinanceSummary(
  filters: CommonFilters & { startDate: string; endDate: string },
): Promise<FinanceSummaryResponse> {
  const start = parseISO(filters.startDate);
  const end = parseISO(filters.endDate);

  // inclusive day count; if dates are reversed, normalize to at least 1 day window
  const daySpan = Math.max(0, differenceInCalendarDays(end, start));
  const windowDays = daySpan + 1;

  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, windowDays - 1);

  const previousFilters: CommonFilters & { startDate: string; endDate: string } = {
    ...filters,
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };

  const [currentSummary, previousSummary, trends] = await Promise.all([
    getDashboardSummary(filters),
    getDashboardSummary(previousFilters),
    getRevenueCostTrends(filters),
  ]);

  const current = toKpis(currentSummary);
  const previous = toKpis(previousSummary);

  return {
    range: { startDate: filters.startDate, endDate: filters.endDate },
    previousRange: { startDate: previousFilters.startDate, endDate: previousFilters.endDate },
    current,
    previous,
    growth: {
      revenuePct: pctGrowth(current.revenue, previous.revenue),
      costPct: pctGrowth(current.cost, previous.cost),
      grossProfitPct: pctGrowth(current.grossProfit, previous.grossProfit),
      profitMarginPctPoints:
        current.profitMargin == null || previous.profitMargin == null
          ? null
          : (current.profitMargin - previous.profitMargin) * 100,
    },
    trends,
  };
}

