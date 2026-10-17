"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/lib/format";
import { AXIS, GRID, SERIES, tooltipStyle } from "./palette";

interface Props {
  portfolio: { date: string; twr: number; value: number; invested: number }[];
  benchmarks: { symbol: string; label: string; series: { date: string; twr: number }[] }[];
  currencySymbol: string;
}

/** Downsample long daily series so the SVG stays light. */
function thin<T>(rows: T[], max = 400): T[] {
  if (rows.length <= max) return rows;
  const step = rows.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(rows[Math.floor(i * step)]);
  out.push(rows.at(-1)!);
  return out;
}

export function PerformanceChart({ portfolio, benchmarks, currencySymbol }: Props) {
  const [mode, setMode] = useState<"return" | "value">("return");
  const [enabled, setEnabled] = useState<string[]>(benchmarks.slice(0, 1).map((b) => b.symbol));

  const data = useMemo(() => {
    const byBench = new Map(benchmarks.map((b) => [b.symbol, new Map(b.series.map((p) => [p.date, p.twr]))]));
    return thin(
      portfolio.map((p) => {
        const row: Record<string, number | string | null> = { date: p.date, portfolio: p.twr, value: p.value, invested: p.invested };
        for (const [s, m] of byBench) row[s] = m.get(p.date) ?? null;
        return row;
      }),
    );
  }, [portfolio, benchmarks]);

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const money = (v: number) => `${currencySymbol}${Math.round(v).toLocaleString("he-IL")}`;

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
          {(["return", "value"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx("rounded-lg px-3 py-1 text-sm", mode === m ? "bg-surface text-fg" : "text-muted")}
            >
              {m === "return" ? "תשואה מצטברת (TWR)" : "שווי מול השקעה"}
            </button>
          ))}
        </div>
        {mode === "return" && (
          <div className="flex flex-wrap gap-1">
            {benchmarks.map((b) => {
              const on = enabled.includes(b.symbol);
              return (
                <button
                  key={b.symbol}
                  onClick={() => setEnabled((e) => (on ? e.filter((x) => x !== b.symbol) : [...e, b.symbol]))}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs",
                    on ? "border-muted text-fg" : "border-line text-muted",
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div dir="ltr" className="h-80">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} minTickGap={50} tickFormatter={(d) => fmtDate(d)} />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={70}
              orientation="right"
              tickFormatter={(v) => (mode === "return" ? pct(Number(v)) : money(Number(v)))}
            />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(d) => fmtDate(String(d))}
              formatter={(v, name) => [mode === "return" ? pct(Number(v)) : money(Number(v)), name]}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} iconType="plainline" />
            {/* Recharts only discovers direct children, so render arrays rather than fragments. */}
            {mode === "return"
              ? [
                  <Line key="portfolio" dataKey="portfolio" name="התיק שלי" stroke={SERIES[0]} strokeWidth={2.5} dot={false} isAnimationActive={false} />,
                  ...benchmarks
                    .map((b, i) =>
                      enabled.includes(b.symbol) ? (
                        <Line
                          key={b.symbol}
                          dataKey={b.symbol}
                          name={b.label}
                          stroke={SERIES[i + 1]}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ) : null,
                    )
                    .filter(Boolean),
                ]
              : [
                  <Line key="value" dataKey="value" name="שווי התיק" stroke={SERIES[0]} strokeWidth={2.5} dot={false} isAnimationActive={false} />,
                  <Line
                    key="invested"
                    dataKey="invested"
                    name="סכום מושקע נטו"
                    stroke={SERIES[1]}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    type="stepAfter"
                    isAnimationActive={false}
                  />,
                ]}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
