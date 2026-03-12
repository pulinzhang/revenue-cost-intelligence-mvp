export type DashboardSummary = {
  totalRevenue: number;
  totalCost: number;
  grossMargin: number;
  grossMarginPct: number | null;
  fixedCost: number;
  variableCost: number;
  breakEvenPoint: number | null;
};

export type TrendPoint = {
  month: string; // YYYY-MM-01
  revenue: number;
  totalCost: number;
};

