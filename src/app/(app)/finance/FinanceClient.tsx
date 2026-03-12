"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { apiFetch } from "@/lib/apiFetch";
import type { FinanceSummaryResponse } from "@/lib/services/financeSummary.service";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { FinanceGrid } from "@/components/finance/FinanceGrid";
import { useI18n } from "@/lib/i18n/I18nProvider";

function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function defaultRange() {
  const now = new Date();
  return { startDate: isoDate(startOfMonth(now)), endDate: isoDate(now) };
}

export function FinanceClient() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const btnClass =
    "h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm hover:bg-zinc-50";

  const initial = useMemo(() => {
    const d = defaultRange();
    return {
      startDate: sp.get("startDate") ?? d.startDate,
      endDate: sp.get("endDate") ?? d.endDate,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);

  const [summary, setSummary] = useState<FinanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateUrl(next: { startDate: string; endDate: string }) {
    const params = new URLSearchParams(sp.toString());
    params.set("startDate", next.startDate);
    params.set("endDate", next.endDate);
    router.replace(`?${params.toString()}`);
  }

  function applyRange(next: { startDate: string; endDate: string }) {
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    updateUrl(next);
  }

  function presetThisMonth() {
    const now = new Date();
    applyRange({ startDate: isoDate(startOfMonth(now)), endDate: isoDate(now) });
  }
  function presetLastMonth() {
    const now = new Date();
    const last = subMonths(now, 1);
    applyRange({ startDate: isoDate(startOfMonth(last)), endDate: isoDate(endOfMonth(last)) });
  }
  function presetLast3Months() {
    const now = new Date();
    applyRange({ startDate: isoDate(startOfMonth(subMonths(now, 2))), endDate: isoDate(now) });
  }
  function presetYtd() {
    const now = new Date();
    applyRange({ startDate: isoDate(startOfYear(now)), endDate: isoDate(now) });
  }
  function presetLast12Months() {
    const now = new Date();
    applyRange({ startDate: isoDate(startOfMonth(subMonths(now, 11))), endDate: isoDate(now) });
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json = await apiFetch<FinanceSummaryResponse>(
          `/api/finance/summary?startDate=${encodeURIComponent(
            startDate,
          )}&endDate=${encodeURIComponent(endDate)}`,
          { cache: "no-store" },
        );
        if (!cancelled) setSummary(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("finance.failedToLoadSummary"));
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("finance.title")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t("finance.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            <button className={btnClass} onClick={presetThisMonth}>
              {t("finance.presetThisMonth")}
            </button>
            <button className={btnClass} onClick={presetLastMonth}>
              {t("finance.presetLastMonth")}
            </button>
            <button className={btnClass} onClick={presetLast3Months}>
              {t("finance.presetLast3Months")}
            </button>
            <button className={btnClass} onClick={presetYtd}>
              {t("finance.presetYtd")}
            </button>
            <button className={btnClass} onClick={presetLast12Months}>
              {t("finance.presetLast12Months")}
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">{t("common.start")}</span>
            <input
              className="h-9 rounded-md border bg-white px-2"
              type="date"
              value={startDate}
              onChange={(e) => applyRange({ startDate: e.target.value, endDate })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">{t("common.end")}</span>
            <input
              className="h-9 rounded-md border bg-white px-2"
              type="date"
              value={endDate}
              onChange={(e) => applyRange({ startDate, endDate: e.target.value })}
            />
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={t("finance.revenue")}
          current={summary?.current.revenue}
          previous={summary?.previous.revenue}
          growthPct={summary?.growth.revenuePct}
          loading={loading}
          fmt={money}
        />
        <KpiCard
          title={t("finance.cost")}
          current={summary?.current.cost}
          previous={summary?.previous.cost}
          growthPct={summary?.growth.costPct}
          loading={loading}
          fmt={money}
        />
        <KpiCard
          title={t("finance.grossProfit")}
          current={summary?.current.grossProfit}
          previous={summary?.previous.grossProfit}
          growthPct={summary?.growth.grossProfitPct}
          loading={loading}
          fmt={money}
        />
        <KpiCard
          title={t("finance.profitMargin")}
          current={summary?.current.profitMargin}
          previous={summary?.previous.profitMargin}
          growthPct={null}
          loading={loading}
          fmt={pct}
          footerDelta={
            summary?.growth.profitMarginPctPoints == null
              ? null
              : `${summary.growth.profitMarginPctPoints >= 0 ? "+" : ""}${summary.growth.profitMarginPctPoints.toFixed(
                  1,
                )} pp`
          }
        />
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-zinc-900">{t("finance.revVsCostMonthly")}</div>
            <div className="text-xs text-zinc-600">
              {startDate} → {endDate}
            </div>
          </div>
        </div>
        <div className="h-[320px]">
          <DashboardCharts trends={summary?.trends ?? []} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <FinanceGrid startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  current,
  previous,
  growthPct,
  loading,
  fmt,
  footerDelta,
}: {
  title: string;
  current: number | null | undefined;
  previous: number | null | undefined;
  growthPct: number | null | undefined;
  loading: boolean;
  fmt: (v: number | null | undefined) => string;
  footerDelta?: string | null;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-zinc-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900">
        {loading ? "…" : fmt(current)}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-600">
        <div>
          {t("common.prev")}:{" "}
          <span className="font-medium text-zinc-900">{loading ? "…" : fmt(previous)}</span>
        </div>
        <div className="text-right">
          {footerDelta ? (
            <span className="font-medium text-zinc-900">{footerDelta}</span>
          ) : (
            <>
              {t("common.growth")}:{" "}
              <span className="font-medium text-zinc-900">{loading ? "…" : fmtPct(growthPct)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function money(v: number | null | undefined) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function pct(v: number | null | undefined) {
  const n = typeof v === "number" ? v : null;
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtPct(v: number | null | undefined) {
  const n = typeof v === "number" ? v : null;
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

