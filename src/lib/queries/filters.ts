export type CommonFilters = {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  region?: string;
  shopId?: string;
};

export function buildWhere(filters: CommonFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.startDate) {
    params.push(filters.startDate);
    clauses.push(`date >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    clauses.push(`date <= $${params.length}`);
  }
  if (filters.region) {
    params.push(filters.region);
    clauses.push(`region = $${params.length}`);
  }
  if (filters.shopId) {
    params.push(filters.shopId);
    clauses.push(`shop_id = $${params.length}`);
  }

  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  return { where, params };
}
