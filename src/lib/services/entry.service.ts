import { insertManualEntry, listManualEntries } from "@/lib/repositories/entries.repo";

export async function createEntry(input: {
  type: string;
  amount: number;
  description?: string | null;
  createdBy: string;
}) {
  // Service boundary: validate business rules, enrich audit data, etc.
  return insertManualEntry(input);
}

export async function listEntries(opts: { limit: number }) {
  return listManualEntries(opts);
}

