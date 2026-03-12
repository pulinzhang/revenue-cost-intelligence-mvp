"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community";
import { ApiFetchError, apiFetch } from "@/lib/apiFetch";
import { useI18n } from "@/lib/i18n/I18nProvider";

type FinanceRow = {
  id: number;
  date: string;
  shopId: string;
  region: string;
  product: string | null;
  revenue: number;
  fixedCost: number;
  variableCost: number;
  totalCost: number;
  grossMargin: number;
};

// AG Grid v35+ requires explicit module registration.
// Guarded so it won't re-register on Fast Refresh / re-import.
let agGridModulesRegistered = false;
if (!agGridModulesRegistered) {
  ModuleRegistry.registerModules([AllCommunityModule]);
  agGridModulesRegistered = true;
}

export function FinanceGrid({
  startDate,
  endDate,
}: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}) {
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const colDefs = useMemo<ColDef<FinanceRow>[]>(
    () => [
      { field: "date", headerName: t("finance.tableDate"), filter: true, minWidth: 120, sort: "desc" },
      { field: "shopId", headerName: t("finance.tableClient"), filter: true, minWidth: 160 },
      {
        field: "revenue",
        headerName: t("finance.tableRevenue"),
        valueFormatter: (p) => money(p.value),
        minWidth: 130,
      },
      {
        field: "totalCost",
        headerName: t("finance.tableCost"),
        valueFormatter: (p) => money(p.value),
        minWidth: 130,
      },
      {
        field: "grossMargin",
        headerName: t("finance.tableProfit"),
        valueFormatter: (p) => money(p.value),
        minWidth: 140,
      },
    ],
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json = await apiFetch<{ rows: FinanceRow[]; totalCount: number }>(
          `/api/finance/list?page=${page}&pageSize=${pageSize}&startDate=${encodeURIComponent(
            startDate,
          )}&endDate=${encodeURIComponent(endDate)}`,
          { cache: "no-store" },
        );
        if (!cancelled) {
          setRows(json.rows ?? []);
          setTotalCount(json.totalCount ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiFetchError ? err.message : t("common.requestFailed"));
          setRows([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = totalCount === 0 ? 0 : Math.min(totalCount, (page - 1) * pageSize + rows.length);

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-zinc-600">
          {t("finance.page")} <span className="font-medium text-zinc-900">{page}</span> / {totalPages} ·{" "}
          {t("finance.pageShowing")} <span className="font-medium text-zinc-900">{startRow}</span>–
          <span className="font-medium text-zinc-900">{endRow}</span> {t("finance.pageOf")}{" "}
          <span className="font-medium text-zinc-900">{totalCount}</span> ·{" "}
          <span className="font-medium text-zinc-900">{rows.length}</span> {t("finance.pageRowsOnThisPage")}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            {t("finance.pageSize")}
            <select
              className="rounded-md border px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              {[25, 50, 100, 200].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("finance.prevPage")}
          </button>
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("finance.nextPage")}
          </button>
        </div>
      </div>

      <div
        className="ag-theme-quartz"
        style={
          {
            height: 560,
            width: "100%",
            // Prevent global `body { color: ... }` from making AG Grid header text invisible
            // (notably in dark mode). These CSS vars are used by the Quartz theme.
            "--ag-foreground-color": "#181d1f",
            "--ag-header-foreground-color": "#181d1f",
          } as CSSProperties
        }
      >
        <AgGridReact<FinanceRow>
          theme="legacy"
          rowData={rows}
          columnDefs={colDefs}
          pagination={false}
          suppressCellFocus={true}
          animateRows={true}
          overlayLoadingTemplate={`<span class="ag-overlay-loading-center">${t("common.loading")}</span>`}
          loadingOverlayComponentParams={{}}
        />
      </div>
    </div>
  );
}

function money(v: unknown) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
