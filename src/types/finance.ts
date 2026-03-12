export type FinanceRow = {
  id: number;
  date: string; // YYYY-MM-DD
  shopId: string;
  region: string;
  product: string | null;
  revenue: number;
  fixedCost: number;
  variableCost: number;
  totalCost: number;
  grossMargin: number;
};

// Manual adjustments / one-off entries not coming from transactions feed.
export type ManualEntry = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdBy: string;
  createdAt: string; // ISO-ish string from DB formatting
};

