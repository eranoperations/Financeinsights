import type { History } from "./types";

/** Per calendar year: total dividends per share and yield vs. the year's closing price. */
export function dividendsByYear(h: History, years = 10): { year: string; dividends: number; yield: number }[] {
  const thisYear = new Date().getUTCFullYear();
  const out: { year: string; dividends: number; yield: number }[] = [];
  for (let y = thisYear - years; y < thisYear; y++) {
    const ys = String(y);
    const divs = h.dividends.filter((d) => d.date.startsWith(ys)).reduce((s, d) => s + d.amount, 0);
    const closes = h.prices.filter((p) => p.date.startsWith(ys));
    if (!closes.length) continue;
    out.push({ year: ys, dividends: divs, yield: divs / closes.at(-1)!.close });
  }
  // Drop leading years before the first dividend so the chart starts where payouts start.
  const first = out.findIndex((r) => r.dividends > 0);
  return first < 0 ? [] : out.slice(first);
}
