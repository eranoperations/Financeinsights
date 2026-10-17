import { addDays, isWeekend, rangeStart, todayISO } from "@/lib/dates";
import { CATALOG, CATALOG_BY_SYMBOL, type CatalogEntry } from "./catalog";
import type {
  EtfDetails,
  FinancialPeriod,
  History,
  HistoryRange,
  MarketDataProvider,
  PricePoint,
  Quote,
  SearchResult,
  StockDetails,
} from "./types";

/**
 * Deterministic synthetic market data. Used when live data is unavailable so the
 * site stays fully functional (development, offline demos, tests).
 */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function entryFor(symbol: string): CatalogEntry {
  const known = CATALOG_BY_SYMBOL.get(symbol.toUpperCase());
  if (known) return known;
  const r = rng(hash(symbol));
  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Inc.`,
    type: "EQUITY",
    currency: "USD",
    exchange: "NASDAQ",
    basePrice: Math.round(20 + r() * 300),
    marketCap: 1e9 * (1 + r() * 100),
  };
}

const HISTORY_START = "2006-01-02";
const seriesCache = new Map<string, History>();

function fullHistory(entry: CatalogEntry): History {
  const cached = seriesCache.get(entry.symbol);
  if (cached && cached.prices.at(-1)?.date === todayISO()) return cached;

  const dates: string[] = [];
  for (let d = HISTORY_START, end = todayISO(); d <= end; d = addDays(d, 1)) {
    if (!isWeekend(d)) dates.push(d);
  }

  const rand = rng(hash(entry.symbol + ":px"));
  const vol = { INDEX: 0.011, ETF: 0.01, CURRENCY: 0.004 }[entry.type as string] ?? 0.019;
  const drift = entry.type === "CURRENCY" ? 0 : 0.0003 + (rand() - 0.5) * 0.0002;
  // Walk backwards from today's base price so the latest price matches the catalog.
  const closes = new Array<number>(dates.length);
  closes[dates.length - 1] = entry.basePrice;
  for (let i = dates.length - 2; i >= 0; i--) {
    const ret = drift + vol * gaussian(rand);
    closes[i] = Math.max(closes[i + 1] / Math.exp(ret), 0.01);
  }
  const prices: PricePoint[] = dates.map((date, i) => ({ date, close: round(closes[i]) }));

  const dividends: History["dividends"] = [];
  if (entry.dividendYield) {
    for (let i = 0; i < prices.length; i += 63) {
      dividends.push({ date: prices[i].date, amount: round((prices[i].close * entry.dividendYield) / 4, 4) });
    }
  }

  const history = { prices, dividends };
  seriesCache.set(entry.symbol, history);
  return history;
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function quoteFor(entry: CatalogEntry): Quote {
  const { prices } = fullHistory(entry);
  const last = prices.at(-1)!.close;
  const prev = prices.at(-2)!.close;
  return {
    symbol: entry.symbol,
    name: entry.name,
    type: entry.type,
    currency: entry.currency,
    exchange: entry.exchange,
    price: last,
    change: round(last - prev),
    changePercent: round(((last - prev) / prev) * 100),
    marketCap: entry.marketCap,
  };
}

function financials(entry: CatalogEntry, quarterly: boolean): FinancialPeriod[] {
  const rand = rng(hash(entry.symbol + (quarterly ? ":q" : ":a")));
  const cap = entry.marketCap ?? 5e10;
  const latestRevenue = cap / (4 + rand() * 8) / (quarterly ? 4 : 1);
  const growth = 0.04 + rand() * 0.25;
  const grossMargin = 0.35 + rand() * 0.4;
  const netMargin = 0.08 + rand() * 0.25;
  const count = quarterly ? 8 : 5;
  const year = new Date().getUTCFullYear() - 1;
  const out: FinancialPeriod[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const periodGrowth = quarterly ? growth / 4 : growth;
    const revenue = latestRevenue / Math.pow(1 + periodGrowth, i) * (0.95 + rand() * 0.1);
    const costOfRevenue = revenue * (1 - grossMargin);
    const grossProfit = revenue - costOfRevenue;
    const netIncome = revenue * netMargin * (0.85 + rand() * 0.3);
    const operatingIncome = netIncome * 1.2;
    const operatingExpense = grossProfit - operatingIncome;
    let period: string;
    let date: string;
    if (quarterly) {
      const qIndex = 4 * year + 3 - i; // last 8 quarters ending Q4 of last year
      const y = Math.floor(qIndex / 4);
      const q = (qIndex % 4) + 1;
      period = `${y}-Q${q}`;
      date = `${y}-${String(q * 3).padStart(2, "0")}-28`;
    } else {
      period = String(year - i);
      date = `${year - i}-12-31`;
    }
    out.push({
      period,
      date,
      revenue,
      costOfRevenue,
      grossProfit,
      operatingExpense,
      totalExpenses: costOfRevenue + operatingExpense,
      operatingIncome,
      netIncome,
      eps: netIncome / ((entry.marketCap ?? 5e10) / entry.basePrice),
      freeCashFlow: netIncome * (0.8 + rand() * 0.5),
    });
  }
  return out;
}

export const mockProvider: MarketDataProvider = {
  name: "mock",

  async search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATALOG.filter((e) => e.symbol.toLowerCase().includes(q) || e.name.toLowerCase().includes(q))
      .slice(0, 10)
      .map<SearchResult>((e) => ({ symbol: e.symbol, name: e.name, type: e.type, exchange: e.exchange }));
  },

  async quotes(symbols) {
    return symbols.map((s) => quoteFor(entryFor(s)));
  },

  async history(symbol, range: HistoryRange | { from: string }) {
    const full = fullHistory(entryFor(symbol));
    const from = typeof range === "string" ? rangeStart(range) : range.from;
    return {
      prices: full.prices.filter((p) => p.date >= from),
      dividends: full.dividends.filter((d) => d.date >= from),
    };
  },

  async stockDetails(symbol): Promise<StockDetails> {
    const entry = entryFor(symbol);
    const quote = quoteFor(entry);
    const annual = financials(entry, false);
    const quarterly = financials(entry, true);
    const { prices } = fullHistory(entry);
    const lastYear = prices.slice(-252).map((p) => p.close);
    const ttmNet = quarterly.slice(-4).reduce((s, p) => s + (p.netIncome ?? 0), 0);
    const shares = (entry.marketCap ?? 5e10) / entry.basePrice;
    const eps = ttmNet / shares;
    return {
      quote,
      profile: {
        sector: entry.sector,
        industry: entry.sector,
        description: `${entry.name} — נתוני הדגמה בלבד. חברו את האתר למקור נתונים חי לקבלת מידע אמיתי.`,
        country: entry.exchange === "TLV" ? "Israel" : "United States",
      },
      stats: {
        marketCap: entry.marketCap,
        peRatio: eps > 0 ? quote.price / eps : undefined,
        eps,
        dividendYield: entry.dividendYield,
        dividendRate: entry.dividendYield ? entry.dividendYield * quote.price : undefined,
        beta: 0.8 + rng(hash(entry.symbol + ":b"))() * 0.8,
        fiftyTwoWeekHigh: Math.max(...lastYear),
        fiftyTwoWeekLow: Math.min(...lastYear),
        profitMargin: annual.at(-1)!.netIncome! / annual.at(-1)!.revenue!,
      },
      annual,
      quarterly,
    };
  },

  async etfDetails(symbol): Promise<EtfDetails> {
    const entry = entryFor(symbol);
    const quote = quoteFor(entry);
    const rand = rng(hash(entry.symbol + ":etf"));
    const pool = CATALOG.filter((e) => e.type === "EQUITY" && e.currency === "USD");
    const picks = [...pool].sort(() => rand() - 0.5).slice(0, 10);
    let remaining = 0.55;
    const holdings = picks.map((p, i) => {
      const w = i === picks.length - 1 ? remaining : remaining * (0.15 + rand() * 0.15);
      remaining -= w;
      return { symbol: p.symbol, name: p.name, weight: w };
    }).sort((a, b) => b.weight - a.weight);
    const sectorNames = ["Technology", "Financial Services", "Healthcare", "Consumer Cyclical", "Communication Services", "Industrials", "Consumer Defensive", "Energy"];
    const raw = sectorNames.map(() => rand());
    const total = raw.reduce((a, b) => a + b, 0);
    const { prices } = fullHistory(entry);
    const annualReturns: EtfDetails["annualReturns"] = [];
    const thisYear = new Date().getUTCFullYear();
    for (let y = thisYear - 10; y < thisYear; y++) {
      const yr = prices.filter((p) => p.date.startsWith(String(y)));
      if (yr.length > 1) annualReturns.push({ year: y, value: yr.at(-1)!.close / yr[0].close - 1 });
    }
    return {
      quote,
      description: `${entry.name} — נתוני הדגמה בלבד.`,
      fundFamily: entry.name.split(" ")[0],
      category: "Large Blend",
      expenseRatio: entry.expenseRatio,
      totalAssets: 1e10 * (1 + rand() * 60),
      dividendYield: entry.dividendYield,
      inceptionDate: "2010-09-07",
      beta3y: 1,
      holdings,
      sectors: sectorNames.map((s, i) => ({ sector: s, weight: raw[i] / total })).sort((a, b) => b.weight - a.weight),
      annualReturns,
    };
  },
};
