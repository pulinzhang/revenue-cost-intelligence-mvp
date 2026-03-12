import { type CommonFilters } from "@/lib/queries/filters";
import { getDashboardSummary, getRevenueCostTrends } from "@/lib/queries/dashboard";

export async function fetchDashboardSummary(filters: CommonFilters) {
  // Service boundary: place for future financial computations / composition.
  return getDashboardSummary(filters);
}

export async function fetchRevenueCostTrends(filters: CommonFilters) {
  return getRevenueCostTrends(filters);
}
