import { type CommonFilters } from "@/lib/queries/filters";
import { listFinanceRows } from "@/lib/queries/finance";

export async function fetchFinanceList(opts: CommonFilters & { page: number; pageSize: number }) {
  // Service boundary: add derived fields / complex finance logic here later.
  return listFinanceRows(opts);
}
