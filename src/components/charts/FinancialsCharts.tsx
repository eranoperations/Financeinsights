"use client";

import { useState } from "react";
import clsx from "clsx";
import type { FinancialPeriod } from "@/lib/market/types";
import { BarSeriesChart } from "./BarSeriesChart";
import { SERIES } from "./palette";

type Mode = "annual" | "quarterly";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function FinancialsCharts({ annual, quarterly }: { annual: FinancialPeriod[]; quarterly: FinancialPeriod[] }) {
  const [mode, setMode] = useState<Mode>(annual.length ? "annual" : "quarterly");
  const rows = (mode === "annual" ? annual : quarterly).map((p) => ({
    ...p,
    expenses: p.totalExpenses ?? (p.costOfRevenue != null && p.operatingExpense != null ? p.costOfRevenue + p.operatingExpense : undefined),
    netMargin: p.revenue && p.netIncome != null ? p.netIncome / p.revenue : undefined,
    grossMargin: p.revenue && p.grossProfit != null ? p.grossProfit / p.revenue : undefined,
  }));

  if (!annual.length && !quarterly.length) {
    return <div className="card p-6 text-center text-muted">אין נתונים פיננסיים זמינים</div>;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">דוחות כספיים</h2>
        <div className="flex gap-1 rounded-xl bg-surface p-1">
          {(["annual", "quarterly"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx("rounded-lg px-3 py-1 text-sm", mode === m ? "bg-surface-2 text-fg" : "text-muted")}
            >
              {m === "annual" ? "שנתי" : "רבעוני"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="הכנסות מול הוצאות">
          <BarSeriesChart
            data={rows}
            xKey="period"
            series={[
              { key: "revenue", name: "הכנסות", color: SERIES[0] },
              { key: "expenses", name: "הוצאות", color: SERIES[1] },
            ]}
          />
        </Panel>
        <Panel title="רווח נקי">
          <BarSeriesChart data={rows} xKey="period" series={[{ key: "netIncome", name: "רווח נקי", color: SERIES[2] }]} signColors />
        </Panel>
        <Panel title="שולי רווח">
          <BarSeriesChart
            data={rows}
            xKey="period"
            valueFormat="pct"
            series={[
              { key: "grossMargin", name: "רווח גולמי", color: SERIES[0] },
              { key: "netMargin", name: "רווח נקי", color: SERIES[2] },
            ]}
          />
        </Panel>
        <Panel title="רווח למניה (EPS)">
          <BarSeriesChart data={rows} xKey="period" valueFormat="number" series={[{ key: "eps", name: "EPS", color: SERIES[0] }]} signColors />
        </Panel>
        {rows.some((r) => r.freeCashFlow != null) && (
          <Panel title="תזרים מזומנים חופשי">
            <BarSeriesChart data={rows} xKey="period" series={[{ key: "freeCashFlow", name: "תזרים חופשי", color: SERIES[0] }]} signColors />
          </Panel>
        )}
      </div>
    </section>
  );
}
