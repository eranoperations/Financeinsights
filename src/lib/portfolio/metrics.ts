import { daysBetween } from "@/lib/dates";
import type { DividendEvent, PricePoint } from "@/lib/market/types";

export interface Txn {
  symbol: string;
  type: "BUY" | "SELL";
  date: string; // YYYY-MM-DD
  quantity: number;
  price: number; // per unit, asset currency
  fee: number; // asset currency
}

export interface AssetSeries {
  currency: string;
  prices: PricePoint[];
  dividends: DividendEvent[];
}

/** Converts `amount` of `currency` on `date` into the portfolio's base currency. */
export type ToBase = (amount: number, currency: string, date: string) => number;

export interface DailyPoint {
  date: string;
  value: number; // market value + dividend cash, base currency
  invested: number; // cumulative net external flows
  flow: number; // net external flow on this day (+ deposit into holdings, - withdrawal)
  twr: number; // cumulative time-weighted return, e.g. 0.12 = +12%
}

export interface Holding {
  symbol: string;
  currency: string;
  quantity: number;
  avgCost: number; // asset currency, per unit
  price: number; // latest close, asset currency
  marketValue: number; // base currency
  costBasis: number; // base currency (at historical FX)
  unrealizedPnl: number; // base currency
  weight: number;
}

export interface PortfolioResult {
  series: DailyPoint[];
  holdings: Holding[];
  totalValue: number;
  netInvested: number;
  totalPnl: number;
  dividendsReceived: number;
  realizedPnl: number;
  twr: number;
  twrAnnualized: number | null;
  /** Money-weighted return (IRR): annualized when the period is at least a year, otherwise for the period. */
  mwr: number | null;
  periodDays: number;
  startDate: string | null;
}

/** Returns a function that forward-fills values from a date-sorted series as dates advance monotonically. */
function forwardFiller(series: PricePoint[]) {
  let i = -1;
  return (date: string): number | undefined => {
    while (i + 1 < series.length && series[i + 1].date <= date) i++;
    return i >= 0 ? series[i].close : series[0]?.close;
  };
}

/** Under a year we report period (non-annualized) returns, so the IRR basis is the period itself. */
function irrBasis(days: number): number {
  return days >= 365 ? 365 : Math.max(days, 1);
}

export function annualize(totalReturn: number, days: number): number | null {
  if (days < 365) return null;
  return Math.pow(1 + totalReturn, 365 / days) - 1;
}

/**
 * XIRR: the rate r where Σ cf_i / (1+r)^(t_i/basisDays) = 0 — annualized with the default
 * basis of 365 days. Cash flows are from the investor's point of view (contributions negative).
 */
export function xirr(flows: { date: string; amount: number }[], basisDays = 365): number | null {
  const cfs = flows.filter((f) => f.amount !== 0);
  if (cfs.length < 2 || !cfs.some((f) => f.amount > 0) || !cfs.some((f) => f.amount < 0)) return null;
  const t0 = cfs[0].date;
  const ts = cfs.map((f) => daysBetween(t0, f.date) / basisDays);
  const npv = (r: number) => cfs.reduce((s, f, i) => s + f.amount / Math.pow(1 + r, ts[i]), 0);
  const dnpv = (r: number) => cfs.reduce((s, f, i) => s - (ts[i] * f.amount) / Math.pow(1 + r, ts[i] + 1), 0);

  let r = 0.1;
  for (let k = 0; k < 100; k++) {
    const v = npv(r);
    const d = dnpv(r);
    if (!Number.isFinite(v) || !Number.isFinite(d) || d === 0) break;
    const next = r - v / d;
    if (next <= -0.9999) break;
    if (Math.abs(next - r) < 1e-10) return next;
    r = next;
  }
  // Fallback: bisection over a wide bracket.
  let lo = -0.9999;
  let hi = 100;
  let flo = npv(lo);
  if (Number.isNaN(flo) || flo * npv(hi) > 0) return null;
  for (let k = 0; k < 300; k++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid);
    if (Math.abs(fm) < 1e-9 || hi - lo < 1e-12) return mid;
    if (fm * flo < 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Builds a daily valuation of the portfolio and computes performance.
 *
 * Model: buys are external contributions, sells are withdrawals of the proceeds,
 * and dividends are kept as cash inside the portfolio (so they count as return).
 * TWR chains daily returns with each day's external flow removed.
 */
export function computePortfolio(
  txns: Txn[],
  assets: Map<string, AssetSeries>,
  toBase: ToBase,
  calendar: string[],
): PortfolioResult {
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  const empty: PortfolioResult = {
    series: [],
    holdings: [],
    totalValue: 0,
    netInvested: 0,
    totalPnl: 0,
    dividendsReceived: 0,
    realizedPnl: 0,
    twr: 0,
    twrAnnualized: null,
    mwr: null,
    periodDays: 0,
    startDate: null,
  };
  if (!sorted.length) return empty;

  const start = sorted[0].date;
  const dates = [...new Set([start, ...calendar.filter((d) => d >= start)])].sort();

  const fill = new Map([...assets].map(([s, a]) => [s, forwardFiller(a.prices)]));
  const divIdx = new Map([...assets].map(([s]) => [s, 0]));

  const qty = new Map<string, number>();
  const costAsset = new Map<string, number>(); // total cost in asset currency, average-cost method
  const costBase = new Map<string, number>(); // same, in base currency at trade-date FX
  let cash = 0; // accumulated dividends, base currency
  let dividendsReceived = 0;
  let realizedPnl = 0;
  let invested = 0;
  let prevValue = 0;
  let growth = 1;
  let t = 0;
  const series: DailyPoint[] = [];
  const irrFlows: { date: string; amount: number }[] = [];

  for (const date of dates) {
    // Dividends with ex-date up to today, paid on shares held before today's trades.
    for (const [symbol, asset] of assets) {
      let i = divIdx.get(symbol)!;
      while (i < asset.dividends.length && asset.dividends[i].date <= date) {
        const held = qty.get(symbol) ?? 0;
        if (held > 0) {
          const amt = toBase(held * asset.dividends[i].amount, asset.currency, asset.dividends[i].date);
          cash += amt;
          dividendsReceived += amt;
        }
        i++;
      }
      divIdx.set(symbol, i);
    }

    let flow = 0;
    while (t < sorted.length && sorted[t].date <= date) {
      const tx = sorted[t++];
      const currency = assets.get(tx.symbol)?.currency ?? "USD";
      const held = qty.get(tx.symbol) ?? 0;
      if (tx.type === "BUY") {
        const gross = tx.quantity * tx.price + tx.fee;
        const grossBase = toBase(gross, currency, tx.date);
        qty.set(tx.symbol, held + tx.quantity);
        costAsset.set(tx.symbol, (costAsset.get(tx.symbol) ?? 0) + gross);
        costBase.set(tx.symbol, (costBase.get(tx.symbol) ?? 0) + grossBase);
        flow += grossBase;
      } else {
        const q = Math.min(tx.quantity, held);
        if (q <= 0) continue;
        const proceedsBase = toBase(q * tx.price - tx.fee, currency, tx.date);
        const frac = q / held;
        const removedBase = (costBase.get(tx.symbol) ?? 0) * frac;
        realizedPnl += proceedsBase - removedBase;
        qty.set(tx.symbol, held - q);
        costAsset.set(tx.symbol, (costAsset.get(tx.symbol) ?? 0) * (1 - frac));
        costBase.set(tx.symbol, (costBase.get(tx.symbol) ?? 0) - removedBase);
        flow -= proceedsBase;
      }
    }

    let value = cash;
    for (const [symbol, q] of qty) {
      if (q <= 0) continue;
      const px = fill.get(symbol)?.(date);
      if (px != null) value += toBase(q * px, assets.get(symbol)!.currency, date);
    }

    // Trades happen at their own price during the day, so the day's flow is treated as
    // end-of-day: r = (V_t - F_t) / V_{t-1} - 1. When there was (almost) nothing invested
    // before today, the new money is the base instead.
    let r = 0;
    if (prevValue > 0.01 * Math.max(flow, 0) && prevValue > 1e-9) r = (value - flow) / prevValue - 1;
    else if (prevValue + flow > 1e-9) r = (value - prevValue - flow) / (prevValue + flow);
    growth *= 1 + r;
    invested += flow;
    if (flow !== 0) irrFlows.push({ date, amount: -flow });
    series.push({ date, value, invested, flow, twr: growth - 1 });
    prevValue = value;
  }

  const last = series.at(-1)!;
  const endDate = last.date;
  const holdings: Holding[] = [];
  for (const [symbol, q] of qty) {
    if (q <= 1e-9) continue;
    const asset = assets.get(symbol);
    const currency = asset?.currency ?? "USD";
    const price = fill.get(symbol)?.(endDate) ?? 0;
    const marketValue = toBase(q * price, currency, endDate);
    const cb = costBase.get(symbol) ?? 0;
    holdings.push({
      symbol,
      currency,
      quantity: q,
      avgCost: (costAsset.get(symbol) ?? 0) / q,
      price,
      marketValue,
      costBasis: cb,
      unrealizedPnl: marketValue - cb,
      weight: 0,
    });
  }
  const holdingsValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  for (const h of holdings) h.weight = holdingsValue > 0 ? h.marketValue / holdingsValue : 0;
  holdings.sort((a, b) => b.marketValue - a.marketValue);

  const days = daysBetween(start, endDate);
  return {
    series,
    holdings,
    totalValue: last.value,
    netInvested: last.invested,
    totalPnl: last.value - last.invested,
    dividendsReceived,
    realizedPnl,
    twr: last.twr,
    twrAnnualized: annualize(last.twr, days),
    mwr: xirr([...irrFlows, { date: endDate, amount: last.value }], irrBasis(days)),
    periodDays: days,
    startDate: start,
  };
}

export interface BenchmarkResult {
  symbol: string;
  label: string;
  /** Cumulative price return of the index (in base currency) over the portfolio's dates. */
  series: { date: string; twr: number; value: number }[];
  twr: number;
  twrAnnualized: number | null;
  /** IRR if the portfolio's exact cash flows had been invested in the index (same basis as the portfolio's MWR). */
  mwr: number | null;
  /** Final value if the portfolio's exact cash flows had been invested in the index. */
  value: number;
}

/** Replays the portfolio's external cash flows into a benchmark index. */
export function computeBenchmark(
  symbol: string,
  label: string,
  index: AssetSeries,
  portfolio: DailyPoint[],
  toBase: ToBase,
): BenchmarkResult | null {
  if (!portfolio.length || !index.prices.length) return null;
  const fill = forwardFiller(index.prices);
  const startPx = fill(portfolio[0].date);
  if (!startPx) return null;
  const startPxBase = toBase(startPx, index.currency, portfolio[0].date);
  let units = 0;
  const series: BenchmarkResult["series"] = [];
  const flows: { date: string; amount: number }[] = [];
  for (const p of portfolio) {
    const px = fill(p.date) ?? startPx;
    const pxBase = toBase(px, index.currency, p.date);
    if (p.flow !== 0 && pxBase > 0) {
      units = Math.max(0, units + p.flow / pxBase);
      flows.push({ date: p.date, amount: -p.flow });
    }
    series.push({ date: p.date, twr: pxBase / startPxBase - 1, value: units * pxBase });
  }
  const last = series.at(-1)!;
  const endDate = portfolio.at(-1)!.date;
  return {
    symbol,
    label,
    series,
    twr: last.twr,
    twrAnnualized: annualize(last.twr, daysBetween(portfolio[0].date, endDate)),
    mwr: xirr([...flows, { date: endDate, amount: last.value }], irrBasis(daysBetween(portfolio[0].date, endDate))),
    value: last.value,
  };
}
