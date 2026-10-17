"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import type { HistoryRange, PricePoint } from "@/lib/market/types";
import { fmtDate, fmtPct, fmtPrice } from "@/lib/format";
import { AXIS, GRID, tooltipStyle } from "./palette";

const RANGES: { id: HistoryRange; label: string }[] = [
  { id: "1mo", label: "חודש" },
  { id: "6mo", label: "6 חודשים" },
  { id: "1y", label: "שנה" },
  { id: "5y", label: "5 שנים" },
  { id: "max", label: "מקסימום" },
];

export function PriceChart({ symbol, currency, initial }: { symbol: string; currency: string; initial: PricePoint[] }) {
  const [range, setRange] = useState<HistoryRange>("1y");
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (range === "1y") {
      setData(initial);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setData(j.prices ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [range, symbol, initial]);

  const first = data[0]?.close;
  const last = data.at(-1)?.close;
  const change = first && last ? last / first - 1 : null;
  const up = (change ?? 0) >= 0;
  const color = up ? "#22c55e" : "#ef4444";

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted">
          שינוי בתקופה: <span className={clsx("num font-semibold", up ? "text-up" : "text-down")}>{fmtPct(change, 2, true)}</span>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-xs font-medium",
                range === r.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div dir="ltr" className={clsx("h-72 transition-opacity", loading && "opacity-50")}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} minTickGap={40} tickFormatter={(d) => fmtDate(d)} />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={60}
              domain={["auto", "auto"]}
              orientation="right"
              tickFormatter={(v) => Number(v).toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(d) => fmtDate(String(d))}
              formatter={(v) => [fmtPrice(Number(v), currency), "מחיר"]}
            />
            <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#fill-${symbol})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
