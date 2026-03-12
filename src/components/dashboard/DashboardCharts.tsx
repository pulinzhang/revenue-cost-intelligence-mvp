"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
} from "recharts";
import type { TrendPoint } from "@/types/dashboard";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function DashboardCharts({ trends }: { trends: TrendPoint[] }) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState<{ [k: string]: boolean }>({});

  const data = useMemo(() => {
    return trends.map((p) => {
      const grossProfit = p.revenue - p.totalCost;
      const marginPct = p.revenue > 0 ? grossProfit / p.revenue : null;
      return { ...p, grossProfit, marginPct };
    });
  }, [trends]);

  const anomaly = useMemo(() => {
    // Find the biggest MoM margin drop and attach a human-ish reason.
    let idx: number | null = null;
    let delta = 0;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1]?.marginPct;
      const cur = data[i]?.marginPct;
      if (typeof prev !== "number" || typeof cur !== "number") continue;
      const d = cur - prev;
      if (idx == null || d < delta) {
        idx = i;
        delta = d;
      }
    }
    if (idx == null || delta >= -0.02) return null; // ignore tiny moves (<2pp)
    const cur = data[idx]!;
    const prev = data[idx - 1]!;
    const costUp = cur.totalCost > prev.totalCost;
    const revDown = cur.revenue < prev.revenue;
    const reason = revDown
      ? t("dashboard.anomalyRevenueDecreased")
      : costUp
        ? t("dashboard.anomalyCostIncreased")
        : t("dashboard.anomalyMixChanged");
    const deltaPp = (Math.abs(delta) * 100).toFixed(1);
    const labelTemplate = t("dashboard.anomalyLabel");
    const label = labelTemplate
      .replace("{delta}", deltaPp)
      .replace("{reason}", reason);
    return {
      month: cur.month,
      marginPct: cur.marginPct as number,
      label,
    };
  }, [data]);

  function compactNumber(v: number) {
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return `${v.toFixed(0)}`;
  }

  function fmtPct(v: number | null | undefined) {
    const n = typeof v === "number" ? v : null;
    if (n == null || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(1)}%`;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1">
        <div className="relative h-full">
          <div className="pointer-events-none absolute left-2 top-1 z-10 text-[11px] text-zinc-500">
            {t("dashboard.yAxisUsdMillions")}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 16, top: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(m) => (typeof m === "string" ? m.slice(0, 7) : m)}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => compactNumber(Number(v))} />
              <Tooltip
                formatter={(value, name) => {
                  const n = Number(value);
                  let labelKey: string;
                  if (name === "revenue") labelKey = "dashboard.legendRevenue";
                  else if (name === "totalCost") labelKey = "dashboard.legendCost";
                  else if (name === "grossProfit") labelKey = "dashboard.legendProfit";
                  else labelKey = String(name ?? "");
                  const label = t(labelKey);
                  return [Number.isFinite(n) ? compactNumber(n) : value, label];
                }}
                labelFormatter={(label) => `${t("dashboard.axisMonth")}: ${label}`}
              />
              <Legend
                onClick={(e: any) => {
                  const key = e?.dataKey as string | undefined;
                  if (!key) return;
                  setHidden((h) => ({ ...h, [key]: !h[key] }));
                }}
                formatter={(value) => {
                  if (value === "revenue") return t("dashboard.legendRevenue");
                  if (value === "totalCost") return t("dashboard.legendCost");
                  if (value === "grossProfit") return t("dashboard.legendProfit");
                  return value as string;
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#16a34a"
                strokeWidth={3.25}
                dot={false}
                hide={!!hidden.revenue}
              />
              <Line
                type="monotone"
                dataKey="totalCost"
                stroke="#dc2626"
                strokeWidth={2.25}
                strokeDasharray="6 4"
                dot={false}
                hide={!!hidden.totalCost}
              />
              <Line
                type="monotone"
                dataKey="grossProfit"
                stroke="#2563eb"
                strokeWidth={2.25}
                dot={false}
                hide={!!hidden.grossProfit}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="h-[140px]">
    <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(m) => (typeof m === "string" ? m.slice(0, 7) : m)}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtPct(Number(v))} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value) => [fmtPct(Number(value)), t("dashboard.marginChartTitle")]}
              labelFormatter={(label) => `${t("dashboard.axisMonth")}: ${label}`}
            />
            {anomaly ? (
              <ReferenceDot
                x={anomaly.month}
                y={anomaly.marginPct}
                r={5}
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={2}
                label={{ value: "!", position: "top", fill: "#ef4444", fontSize: 10 }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="marginPct"
              stroke="#0f766e"
              strokeWidth={2.5}
              dot={(props: any) => {
                const cx = props?.cx;
                const cy = props?.cy;
                const payload = props?.payload as any;
                if (!payload || anomaly?.month !== payload.month) return null;
                return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
              }}
            />
      </LineChart>
    </ResponsiveContainer>
        {anomaly ? <div className="mt-1 text-xs text-zinc-500">{anomaly.label}</div> : null}
      </div>
    </div>
  );
}
