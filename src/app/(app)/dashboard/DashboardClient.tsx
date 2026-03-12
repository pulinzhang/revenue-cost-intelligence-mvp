"use client";

import type { DashboardSummary, TrendPoint } from "@/types/dashboard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function DashboardClient({
  summary,
  previousSummary,
  growth,
  trends,
  startDate,
  endDate,
  previousStartDate,
  previousEndDate,
}: {
  summary: DashboardSummary;
  previousSummary: DashboardSummary;
  growth: {
    revenuePct: number | null;
    costPct: number | null;
    grossProfitPct: number | null;
    grossMarginPctPoints: number | null;
  };
  trends: TrendPoint[];
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();

  const segBase =
    "h-9 rounded-md border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400/30";
  const segActive = "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800";
  const segInactive = "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50";

  const current = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);

  function updateUrl(next: { startDate: string; endDate: string }) {
    const params = new URLSearchParams(sp.toString());
    params.set("startDate", next.startDate);
    params.set("endDate", next.endDate);
    router.replace(`?${params.toString()}`);
    router.refresh();
  }

  function applyRange(next: { startDate: string; endDate: string }) {
    updateUrl(next);
  }

  const presetRanges = useMemo(() => {
    const now = new Date();
    return {
      thisMonth: { startDate: isoDate(startOfMonth(now)), endDate: isoDate(now) },
      lastMonth: (() => {
        const last = subMonths(now, 1);
        return { startDate: isoDate(startOfMonth(last)), endDate: isoDate(endOfMonth(last)) };
      })(),
      last3Months: {
        startDate: isoDate(startOfMonth(subMonths(now, 3))),
        endDate: isoDate(endOfMonth(subMonths(now, 1))),
      },
      last6Months: {
        startDate: isoDate(startOfMonth(subMonths(now, 6))),
        endDate: isoDate(endOfMonth(subMonths(now, 1))),
      },
      ytd: { startDate: isoDate(startOfYear(now)), endDate: isoDate(now) },
      last12Months: {
        startDate: isoDate(startOfMonth(subMonths(now, 12))),
        endDate: isoDate(endOfMonth(subMonths(now, 1))),
      },
    };
  }, []);

  const activePreset = useMemo(() => {
    const entries = Object.entries(presetRanges) as Array<
      [keyof typeof presetRanges, { startDate: string; endDate: string }]
    >;
    const hit = entries.find(([, r]) => r.startDate === startDate && r.endDate === endDate);
    return hit?.[0] ?? null;
  }, [endDate, presetRanges, startDate]);

  function moneyCompact(v: number | null | undefined) {
    const n = typeof v === "number" ? v : null;
    if (n == null || !Number.isFinite(n)) return "—";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: Math.abs(n) >= 1_000_000 ? 2 : 0,
    }).format(n);
  }

  function pct(v: number | null | undefined, digits = 1) {
    const n = typeof v === "number" ? v : null;
    if (n == null || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(digits)}%`;
  }

  function fmtGrowth(v: number | null | undefined) {
    const n = typeof v === "number" ? v : null;
    if (n == null || !Number.isFinite(n)) return "—";
    const sign = n > 0 ? "+" : "";
    return `${sign}${(n * 100).toFixed(1)}%`;
  }

  const compareLabel = useMemo(() => {
    // Best-effort labeling: for long windows treat it as YoY-ish, otherwise MoM-ish.
    const s = parseISO(startDate);
    const e = parseISO(endDate);
    const windowDays = Math.max(0, differenceInCalendarDays(e, s)) + 1;
    if (windowDays >= 330) return t("dashboard.compareYoY");
    return t("dashboard.compareMoM");
  }, [endDate, startDate, t]);

  function TrendDelta({ v }: { v: number | null | undefined }) {
    const n = typeof v === "number" ? v : null;
    if (n == null || !Number.isFinite(n)) return <span className="text-zinc-500">—</span>;
    const up = n > 0;
    const down = n < 0;
    const tone = up
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : down
        ? "text-rose-700 bg-rose-50 border-rose-200"
        : "text-zinc-700 bg-zinc-50 border-zinc-200";
    const arrow = up ? "↑" : down ? "↓" : "→";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}
      >
        <span className="tabular-nums">{fmtGrowth(n)}</span>
        <span className="text-[11px]">{compareLabel}</span>
        <span className="text-[11px]">{arrow}</span>
      </span>
    );
  }

  function PpDelta({ v }: { v: number | null | undefined }) {
    const n = typeof v === "number" ? v : null;
    if (n == null || !Number.isFinite(n)) return <span className="text-zinc-500">—</span>;
    const up = n > 0;
    const down = n < 0;
    const tone = up
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : down
        ? "text-rose-700 bg-rose-50 border-rose-200"
        : "text-zinc-700 bg-zinc-50 border-zinc-200";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}
      >
        <span className="tabular-nums">{`${n >= 0 ? "+" : ""}${n.toFixed(1)} pp`}</span>
        <span className="text-[11px]">{compareLabel}</span>
      </span>
    );
  }

  const profit = summary.grossMargin;
  const prevProfit = previousSummary.grossMargin;

  const totalCost = summary.totalCost;
  const fixedRatio = totalCost > 0 ? summary.fixedCost / totalCost : null;
  const variableRatio = totalCost > 0 ? summary.variableCost / totalCost : null;
  const costRatio = summary.totalRevenue > 0 ? summary.totalCost / summary.totalRevenue : null;
  const prevCostRatio =
    previousSummary.totalRevenue > 0
      ? previousSummary.totalCost / previousSummary.totalRevenue
      : null;
  const costRatioDeltaPp =
    costRatio == null || prevCostRatio == null ? null : (costRatio - prevCostRatio) * 100;

  const contributionMargin =
    summary.totalRevenue > 0
      ? (summary.totalRevenue - summary.variableCost) / summary.totalRevenue
      : null;

  const revenueAboveBreakEvenPct =
    summary.breakEvenPoint != null &&
    Number.isFinite(summary.breakEvenPoint) &&
    summary.breakEvenPoint > 0
      ? summary.totalRevenue / summary.breakEvenPoint - 1
      : null;

  const alerts = useMemo(() => {
    const items: Array<{ type: "warn" | "info"; text: string }> = [];
    const rev = growth.revenuePct;
    const cost = growth.costPct;
    if (
      typeof rev === "number" &&
      typeof cost === "number" &&
      Number.isFinite(rev) &&
      Number.isFinite(cost)
    ) {
      if (cost - rev > 0.05)
        items.push({ type: "warn", text: t("dashboard.alertCostOutpacingRevenue") });
    }
    if (
      typeof growth.grossMarginPctPoints === "number" &&
      Number.isFinite(growth.grossMarginPctPoints)
    ) {
      if (growth.grossMarginPctPoints <= -1)
        items.push({ type: "warn", text: t("dashboard.alertMarginDown") });
      if (growth.grossMarginPctPoints >= 1)
        items.push({ type: "info", text: t("dashboard.alertMarginUp") });
    }
    if (
      summary.breakEvenPoint != null &&
      Number.isFinite(summary.breakEvenPoint) &&
      summary.breakEvenPoint > 0
    ) {
      const headroom = summary.totalRevenue - summary.breakEvenPoint;
      if (summary.totalRevenue > 0) {
        const headroomPct = headroom / summary.totalRevenue;
        if (headroomPct < 0.1)
          items.push({ type: "warn", text: t("dashboard.alertNearBreakEven") });
      }
    }
    return items.slice(0, 3);
  }, [growth.costPct, growth.grossMarginPctPoints, growth.revenuePct, summary, t]);

  const insights = useMemo(() => {
    const items: string[] = [];
    const rev = growth.revenuePct;
    const cost = growth.costPct;
    const marginPp = growth.grossMarginPctPoints;

    if (
      typeof rev === "number" &&
      typeof cost === "number" &&
      Number.isFinite(rev) &&
      Number.isFinite(cost)
    ) {
      if (cost > rev + 0.01) {
        items.push(
          `Revenue grew ${fmtGrowth(rev)}, but cost grew faster at ${fmtGrowth(cost)} — margin pressure is likely coming from costs.`,
        );
      } else if (rev > cost + 0.01) {
        items.push(
          `Revenue grew ${fmtGrowth(rev)} while cost grew ${fmtGrowth(cost)} — operating leverage is improving.`,
        );
      } else {
        items.push(
          `Revenue and cost moved similarly (${fmtGrowth(rev)} vs ${fmtGrowth(cost)}), so margin changes are likely driven by mix and pricing.`,
        );
      }
    }

    if (typeof marginPp === "number" && Number.isFinite(marginPp)) {
      if (marginPp <= -0.2) {
        items.push(
          `Margin declined ${Math.abs(marginPp).toFixed(1)}pp. Check variable cost and cost ratio for the key driver.`,
        );
      } else if (marginPp >= 0.2) {
        items.push(
          `Margin improved +${marginPp.toFixed(1)}pp. This often indicates better pricing, mix, or slower cost growth.`,
        );
      }
    }

    if (
      typeof costRatioDeltaPp === "number" &&
      Number.isFinite(costRatioDeltaPp) &&
      Math.abs(costRatioDeltaPp) >= 0.2
    ) {
      items.push(
        `Cost ratio changed ${costRatioDeltaPp >= 0 ? "+" : ""}${costRatioDeltaPp.toFixed(1)}pp vs the prior period — this is the clearest “efficiency” signal.`,
      );
    }

    if (
      summary.breakEvenPoint != null &&
      Number.isFinite(summary.breakEvenPoint) &&
      summary.breakEvenPoint > 0
    ) {
      const headroom = summary.totalRevenue - summary.breakEvenPoint;
      if (headroom < 0) {
        items.push(
          `Revenue is below break-even — focus on variable-cost reduction or pricing to recover margin.`,
        );
      } else if (revenueAboveBreakEvenPct != null && Number.isFinite(revenueAboveBreakEvenPct)) {
        items.push(
          `Revenue is ${fmtGrowth(revenueAboveBreakEvenPct)} above break-even — you have a meaningful safety buffer for this range.`,
        );
      }
    }
    return items.filter(Boolean).slice(0, 4);
  }, [
    compareLabel,
    costRatioDeltaPp,
    fmtGrowth,
    growth.costPct,
    growth.grossMarginPctPoints,
    growth.revenuePct,
    revenueAboveBreakEvenPct,
    summary.breakEvenPoint,
    summary.totalRevenue,
  ]);

  function presetThisMonth() {
    applyRange(presetRanges.thisMonth);
  }
  function presetLastMonth() {
    applyRange(presetRanges.lastMonth);
  }
  function presetLast3Months() {
    applyRange(presetRanges.last3Months);
  }
  function presetLast6Months() {
    applyRange(presetRanges.last6Months);
  }
  function presetYtd() {
    applyRange(presetRanges.ytd);
  }
  function presetLast12Months() {
    applyRange(presetRanges.last12Months);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("dashboard.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              className={`${segBase} ${activePreset === "thisMonth" ? segActive : segInactive}`}
              onClick={presetThisMonth}
            >
              {t("dashboard.presetThisMonth")}
            </button>
            <button
              className={`${segBase} ${activePreset === "lastMonth" ? segActive : segInactive}`}
              onClick={presetLastMonth}
            >
              {t("dashboard.presetLastMonth")}
            </button>
            <button
              className={`${segBase} ${activePreset === "last3Months" ? segActive : segInactive}`}
              onClick={presetLast3Months}
            >
              {t("dashboard.presetLast3Months")}
            </button>
            <button
              className={`${segBase} ${activePreset === "last6Months" ? segActive : segInactive}`}
              onClick={presetLast6Months}
            >
              {t("dashboard.presetLast6Months")}
            </button>
            <button
              className={`${segBase} ${activePreset === "ytd" ? segActive : segInactive}`}
              onClick={presetYtd}
            >
              {t("dashboard.presetYtd")}
            </button>
            <button
              className={`${segBase} ${activePreset === "last12Months" ? segActive : segInactive}`}
              onClick={presetLast12Months}
            >
              {t("dashboard.presetLast12Months")}
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

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">{t("dashboard.range")}</span>
            <span className="tabular-nums text-zinc-900">
              {current.startDate} → {current.endDate}
            </span>
            <span className="tabular-nums text-xs text-zinc-500">
              {t("common.prev")}: {previousStartDate} → {previousEndDate}
            </span>
          </div>
        </div>
      </div>

      {alerts.length ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium text-zinc-900">{t("dashboard.alertsTitle")}</div>
          <div className="mt-2 grid gap-2">
            {alerts.map((a, idx) => (
              <div
                key={idx}
                className={`rounded-md border px-3 py-2 text-sm ${
                  a.type === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-blue-200 bg-blue-50 text-blue-900"
                }`}
              >
                {a.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Section title={t("dashboard.sectionCore")}>
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title={t("dashboard.totalRevenue")}
            value={moneyCompact(summary.totalRevenue)}
            sub={<TrendDelta v={growth.revenuePct} />}
            emphasis
          />
          <KpiCard
            title={t("dashboard.grossProfit")}
            value={moneyCompact(profit)}
            sub={<TrendDelta v={growth.grossProfitPct} />}
          />
          <KpiCard
            title={t("dashboard.marginPct")}
            value={summary.grossMarginPct == null ? "—" : pct(summary.grossMarginPct, 1)}
            sub={<PpDelta v={growth.grossMarginPctPoints} />}
          />
        </div>
      </Section>

      <Section title={t("dashboard.sectionCostStructure")}>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            title={t("dashboard.totalCost")}
            value={moneyCompact(summary.totalCost)}
            sub={<TrendDelta v={growth.costPct} />}
          />
          <KpiCard
            title={t("dashboard.fixedCost")}
            value={moneyCompact(summary.fixedCost)}
            sub={fixedRatio == null ? "—" : `${pct(fixedRatio, 1)} ${t("dashboard.ofTotalCost")}`}
          />
          <KpiCard
            title={t("dashboard.variableCost")}
            value={moneyCompact(summary.variableCost)}
            sub={
              variableRatio == null ? "—" : `${pct(variableRatio, 1)} ${t("dashboard.ofTotalCost")}`
            }
          />
          <KpiCard
            title={t("dashboard.costRatio")}
            value={costRatio == null ? "—" : pct(costRatio, 1)}
            sub={<PpDelta v={costRatioDeltaPp} />}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-zinc-50 p-4">
            <div className="mb-1 text-sm font-medium text-zinc-900">{t("dashboard.costMix")}</div>
            <div className="text-xs text-zinc-600">{t("dashboard.costMixHelp")}</div>
            <div className="mt-3 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: t("dashboard.fixedCost"), value: Math.max(0, summary.fixedCost) },
                      {
                        name: t("dashboard.variableCost"),
                        value: Math.max(0, summary.variableCost),
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                  >
                    <Cell fill="#f43f5e" />
                    <Cell fill="#fb923c" />
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [moneyCompact(Number(value)), name]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-rose-500 align-middle" />{" "}
                {t("dashboard.fixedCost")} {fixedRatio == null ? "—" : pct(fixedRatio, 1)}
              </span>
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-orange-400 align-middle" />{" "}
                {t("dashboard.variableCost")} {variableRatio == null ? "—" : pct(variableRatio, 1)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium text-zinc-900">
              {t("dashboard.contributionMargin")}
            </div>
            <div className="mt-2 flex flex-col gap-2 text-sm text-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">{t("dashboard.contributionMarginRate")}</span>
                <span className="font-medium tabular-nums">
                  {contributionMargin == null ? "—" : pct(contributionMargin, 1)}
                </span>
              </div>
              <div className="text-xs text-zinc-600">{t("dashboard.contributionMarginHelp")}</div>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t("dashboard.sectionAnalysis")}>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            title={t("dashboard.breakEvenPoint")}
            value={summary.breakEvenPoint == null ? "—" : moneyCompact(summary.breakEvenPoint)}
            sub={t("dashboard.breakEvenHelp")}
          />
          <KpiCard
            title={t("dashboard.safetyMargin")}
            value={revenueAboveBreakEvenPct == null ? "—" : pct(revenueAboveBreakEvenPct, 0)}
            sub={t("dashboard.safetyMarginHelp")}
          />
          <KpiCard
            title={t("dashboard.prevGrossProfit")}
            value={moneyCompact(prevProfit)}
            sub={`${t("common.prev")}: ${previousStartDate} → ${previousEndDate}`}
          />
          <KpiCard
            title={t("dashboard.prevRevenue")}
            value={moneyCompact(previousSummary.totalRevenue)}
            sub={`${t("common.prev")}: ${previousStartDate} → ${previousEndDate}`}
          />
        </div>
      </Section>

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{t("dashboard.trendTitle")}</h2>
            <div className="mt-0.5 text-xs text-zinc-500">
              {current.startDate} → {current.endDate} · {t("dashboard.monthlyAggregation")}
            </div>
          </div>
        </div>
        <div className="mt-4 h-[420px]">
          <DashboardCharts trends={trends} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="text-sm font-semibold text-zinc-900">{t("dashboard.insightsTitle")}</div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-700">
          {insights.map((it, idx) => (
            <div key={idx} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              {it}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      {children}
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  emphasis,
}: {
  title: string;
  value: string;
  sub?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${emphasis ? "md:col-span-1" : ""}`}>
      <div className="text-sm text-zinc-600">{title}</div>
      <div className={`mt-2 font-semibold text-zinc-900 ${emphasis ? "text-3xl" : "text-2xl"}`}>
        {value}
      </div>
      {sub ? <div className="mt-2 text-sm text-zinc-600">{sub}</div> : null}
    </div>
  );
}
