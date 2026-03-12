import { differenceInCalendarDays, parseISO, subDays } from "date-fns";
import type { CommonFilters } from "@/lib/queries/filters";
import { getDashboardSummary, getRevenueCostTrends } from "@/lib/queries/dashboard";
import type { DashboardSummary, TrendPoint } from "@/types/dashboard";

function pctGrowth(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export type DashboardOverviewResponse = {
  range: { startDate: string; endDate: string };
  previousRange: { startDate: string; endDate: string };
  summary: DashboardSummary;
  previousSummary: DashboardSummary;
  growth: {
    revenuePct: number | null;
    costPct: number | null;
    grossProfitPct: number | null;
    grossMarginPctPoints: number | null; // delta in percentage points (0..100)
  };
  trends: TrendPoint[];
};

export async function fetchDashboardOverview(
  filters: CommonFilters & { startDate: string; endDate: string },
): Promise<DashboardOverviewResponse> {
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

  const [summary, previousSummary, trends] = await Promise.all([
    getDashboardSummary(filters),
    getDashboardSummary(previousFilters),
    getRevenueCostTrends(filters),
  ]);

  return {
    range: { startDate: filters.startDate, endDate: filters.endDate },
    previousRange: { startDate: previousFilters.startDate, endDate: previousFilters.endDate },
    summary,
    previousSummary,
    growth: {
      revenuePct: pctGrowth(summary.totalRevenue, previousSummary.totalRevenue),
      costPct: pctGrowth(summary.totalCost, previousSummary.totalCost),
      grossProfitPct: pctGrowth(summary.grossMargin, previousSummary.grossMargin),
      grossMarginPctPoints:
        summary.grossMarginPct == null || previousSummary.grossMarginPct == null
          ? null
          : (summary.grossMarginPct - previousSummary.grossMarginPct) * 100,
    },
    trends,
  };
}
