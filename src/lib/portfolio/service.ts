import "server-only";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/dates";
import { BENCHMARKS } from "@/lib/market/catalog";
import { market, type PricePoint } from "@/lib/market";
import {
  computeBenchmark,
  computePortfolio,
  type AssetSeries,
  type BenchmarkResult,
  type PortfolioResult,
  type ToBase,
  type Txn,
} from "./metrics";

export type BaseCurrency = "USD" | "ILS";

export interface PortfolioView {
  base: BaseCurrency;
  result: PortfolioResult;
  benchmarks: BenchmarkResult[];
  names: Record<string, string>;
  transactions: (Txn & { id: string; currency: string })[];
  demo: boolean;
}

function lookup(series: PricePoint[], date: string): number | undefined {
  let lo = 0;
  let hi = series.length - 1;
  let ans: number | undefined = series[0]?.close;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].date <= date) {
      ans = series[mid].close;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/** Normalizes sub-units (Tel Aviv prices are quoted in agorot). */
function normalize(currency: string): { currency: string; factor: number } {
  if (currency === "ILA") return { currency: "ILS", factor: 0.01 };
  if (currency === "GBp") return { currency: "GBP", factor: 0.01 };
  return { currency, factor: 1 };
}

export async function loadPortfolio(userId: string, base: BaseCurrency): Promise<PortfolioView> {
  const rows = await db.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } });
  const txns: (Txn & { id: string })[] = rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    type: r.type === "SELL" ? "SELL" : "BUY",
    date: r.date.toISOString().slice(0, 10),
    quantity: r.quantity,
    price: r.price,
    fee: r.fee,
  }));

  const symbols = [...new Set(txns.map((t) => t.symbol))];
  const benchSymbols = BENCHMARKS.map((b) => b.symbol);
  const start = txns[0]?.date ?? todayISO();

  const quotes = await market.quotes([...symbols, ...benchSymbols]);
  let demo = quotes.demo;
  const quoteBySymbol = new Map(quotes.data.map((q) => [q.symbol, q]));

  const histories = await Promise.all(
    [...symbols, ...benchSymbols].map(async (s) => {
      const firstForSymbol = txns.find((t) => t.symbol === s)?.date ?? start;
      const h = await market.history(s, { from: firstForSymbol < start ? firstForSymbol : start });
      demo ||= h.demo;
      return [s, h.data] as const;
    }),
  );

  const assets = new Map<string, AssetSeries>();
  for (const [s, h] of histories) {
    const currency = quoteBySymbol.get(s)?.currency ?? (s.endsWith(".TA") ? "ILA" : "USD");
    assets.set(s, { currency, prices: h.prices, dividends: h.dividends });
  }

  // FX series: units of base currency per 1 unit of foreign currency.
  const foreign = new Set<string>();
  for (const a of assets.values()) {
    const c = normalize(a.currency).currency;
    if (c !== base) foreign.add(c);
  }
  const fx = new Map<string, PricePoint[]>();
  await Promise.all(
    [...foreign].map(async (c) => {
      const h = await market.history(`${c}${base}=X`, { from: start });
      demo ||= h.demo;
      fx.set(c, h.data.prices);
    }),
  );

  const toBase: ToBase = (amount, currency, date) => {
    const n = normalize(currency);
    const v = amount * n.factor;
    if (n.currency === base) return v;
    const series = fx.get(n.currency);
    const rate = series?.length ? lookup(series, date) : undefined;
    return rate ? v * rate : v;
  };

  const holdingAssets = new Map(symbols.map((s) => [s, assets.get(s)!]));
  const calendar = [...new Set(symbols.flatMap((s) => assets.get(s)!.prices.map((p) => p.date)))].sort();
  const result = computePortfolio(txns, holdingAssets, toBase, calendar);

  const benchmarks = BENCHMARKS.map((b) => computeBenchmark(b.symbol, b.label, assets.get(b.symbol)!, result.series, toBase)).filter(
    (b): b is BenchmarkResult => b !== null,
  );

  return {
    base,
    result,
    benchmarks,
    names: Object.fromEntries(symbols.map((s) => [s, quoteBySymbol.get(s)?.name ?? s])),
    transactions: txns.map((t) => ({ ...t, currency: assets.get(t.symbol)?.currency ?? "USD" })).reverse(),
    demo,
  };
}
