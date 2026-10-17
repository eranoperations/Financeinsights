"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, GRID, tooltipStyle } from "./palette";

export interface BarSeries {
  key: string;
  name: string;
  color: string;
}

export type ValueFormat = "compact" | "pct" | "number";

function format(v: number, f: ValueFormat): string {
  if (!Number.isFinite(v)) return "—";
  if (f === "pct") return `${(v * 100).toFixed(2)}%`;
  if (f === "number") return v.toFixed(2);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  return `${sign}${abs.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}

/**
 * Grouped bar chart on a single y-axis. With `signColors`, a single series is colored
 * green/red by sign (e.g. annual returns).
 */
export function BarSeriesChart({
  data,
  xKey,
  series,
  valueFormat = "compact",
  signColors = false,
  height = 260,
}: {
  data: Record<string, string | number | undefined>[];
  xKey: string;
  series: BarSeries[];
  valueFormat?: ValueFormat;
  signColors?: boolean;
  height?: number;
}) {
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} orientation="right" tickFormatter={(v) => format(Number(v), valueFormat)} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v, name) => [format(Number(v), valueFormat), name]} />
          {series.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 13, color: "#8b95a7" }} iconType="circle" iconSize={8} />
          )}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
              {signColors &&
                data.map((d, i) => <Cell key={i} fill={Number(d[s.key]) >= 0 ? "#22c55e" : "#ef4444"} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
