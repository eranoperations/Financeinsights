import YahooFinance from "yahoo-finance2";
import { rangeStart, toISODate } from "@/lib/dates";
import type {
  AssetType,
  EtfDetails,
  FinancialPeriod,
  History,
  HistoryRange,
  MarketDataProvider,
  Quote,
  StockDetails,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Yahoo responses change shape often; we read fields defensively instead of
// relying on the library's strict schema validation.
const NO_VALIDATE = { validateResult: false } as const;

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function raw(v: any): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "object" && typeof v.raw === "number") return v.raw;
  return undefined;
}

function toDate(v: any): string | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return toISODate(v);
  if (typeof v === "number") return toISODate(new Date(v < 1e11 ? v * 1000 : v));
  if (typeof v === "string") return v.slice(0, 10);
  if (typeof v === "object" && "raw" in v) return toDate(v.raw);
  return undefined;
}

function assetType(t: string | undefined): AssetType {
  switch ((t ?? "").toUpperCase()) {
    case "EQUITY":
      return "EQUITY";
    case "ETF":
      return "ETF";
    case "INDEX":
      return "INDEX";
    case "MUTUALFUND":
      return "MUTUALFUND";
    case "CRYPTOCURRENCY":
      return "CRYPTO";
    case "CURRENCY":
      return "CURRENCY";
    default:
      return "OTHER";
  }
}

function mapQuote(q: any): Quote {
  return {
    symbol: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    type: assetType(q.quoteType),
    currency: q.currency ?? "USD",
    exchange: q.fullExchangeName ?? q.exchange,
    price: raw(q.regularMarketPrice) ?? 0,
    change: raw(q.regularMarketChange) ?? 0,
    changePercent: raw(q.regularMarketChangePercent) ?? 0,
    marketCap: raw(q.marketCap),
  };
}

async function financialSeries(symbol: string, type: "annual" | "quarterly"): Promise<FinancialPeriod[]> {
  const period1 = type === "annual" ? "2015-01-01" : rangeStart("5y");
  const [fin, cash] = await Promise.all([
    yahooFinance.fundamentalsTimeSeries(symbol, { period1, type, module: "financials" }, NO_VALIDATE).catch(() => []),
    yahooFinance.fundamentalsTimeSeries(symbol, { period1, type, module: "cash-flow" }, NO_VALIDATE).catch(() => []),
  ]);
  const byDate = new Map<string, FinancialPeriod>();
  for (const row of [...(fin as any[]), ...(cash as any[])]) {
    const date = toDate(row.date);
    if (!date) continue;
    const p = byDate.get(date) ?? { date, period: periodLabel(date, type) };
    p.revenue ??= raw(row.totalRevenue);
    p.costOfRevenue ??= raw(row.costOfRevenue);
    p.grossProfit ??= raw(row.grossProfit);
    p.operatingExpense ??= raw(row.operatingExpense);
    p.totalExpenses ??= raw(row.totalExpenses);
    p.operatingIncome ??= raw(row.operatingIncome);
    p.netIncome ??= raw(row.netIncome) ?? raw(row.netIncomeCommonStockholders);
    p.eps ??= raw(row.dilutedEPS) ?? raw(row.basicEPS);
    p.freeCashFlow ??= raw(row.freeCashFlow);
    byDate.set(date, p);
  }
  return [...byDate.values()]
    .filter((p) => p.revenue != null || p.netIncome != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function periodLabel(date: string, type: "annual" | "quarterly"): string {
  const [y, m] = date.split("-").map(Number);
  if (type === "annual") return String(y);
  return `${y}-Q${Math.ceil(m / 3)}`;
}

export const yahooProvider: MarketDataProvider = {
  name: "yahoo",

  async search(query) {
    const res: any = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 }, NO_VALIDATE);
    return (res.quotes ?? [])
      .filter((q: any) => q.symbol && q.isYahooFinance !== false)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        type: assetType(q.quoteType),
        exchange: q.exchDisp ?? q.exchange,
      }));
  },

  async quotes(symbols) {
    if (!symbols.length) return [];
    const res: any = await yahooFinance.quote(symbols, {}, NO_VALIDATE);
    const list: any[] = Array.isArray(res) ? res : [res];
    const bySymbol = new Map(list.map((q) => [q.symbol, mapQuote(q)]));
    return symbols.map((s) => bySymbol.get(s)).filter((q): q is Quote => !!q);
  },

  async history(symbol, range: HistoryRange | { from: string }) {
    const period1 = typeof range === "string" ? rangeStart(range) : range.from;
    const interval = range === "max" || range === "5y" ? "1wk" : "1d";
    const res: any = await yahooFinance.chart(symbol, { period1, interval, events: "div" }, NO_VALIDATE);
    const prices = (res.quotes ?? [])
      .filter((q: any) => typeof q.close === "number")
      .map((q: any) => ({ date: toDate(q.date)!, close: q.close }));
    const dividends = (res.events?.dividends ?? [])
      .map((d: any) => ({ date: toDate(d.date)!, amount: d.amount }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));
    return { prices, dividends } satisfies History;
  },

  async stockDetails(symbol): Promise<StockDetails> {
    const [summary, annual, quarterly]: [any, FinancialPeriod[], FinancialPeriod[]] = await Promise.all([
      yahooFinance.quoteSummary(
        symbol,
        { modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"] },
        NO_VALIDATE,
      ),
      financialSeries(symbol, "annual"),
      financialSeries(symbol, "quarterly"),
    ]);
    const price = summary.price ?? {};
    const sd = summary.summaryDetail ?? {};
    const ks = summary.defaultKeyStatistics ?? {};
    const fd = summary.financialData ?? {};
    const ap = summary.assetProfile ?? {};
    return {
      quote: mapQuote({ ...price, symbol: price.symbol ?? symbol, marketCap: price.marketCap ?? sd.marketCap }),
      profile: {
        sector: ap.sector,
        industry: ap.industry,
        description: ap.longBusinessSummary,
        website: ap.website,
        employees: ap.fullTimeEmployees,
        country: ap.country,
      },
      stats: {
        marketCap: raw(price.marketCap) ?? raw(sd.marketCap),
        peRatio: raw(sd.trailingPE),
        forwardPe: raw(sd.forwardPE) ?? raw(ks.forwardPE),
        eps: raw(ks.trailingEps),
        dividendYield: raw(sd.dividendYield) ?? raw(sd.trailingAnnualDividendYield),
        dividendRate: raw(sd.dividendRate) ?? raw(sd.trailingAnnualDividendRate),
        payoutRatio: raw(sd.payoutRatio),
        beta: raw(sd.beta) ?? raw(ks.beta),
        fiftyTwoWeekHigh: raw(sd.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: raw(sd.fiftyTwoWeekLow),
        volume: raw(sd.volume),
        avgVolume: raw(sd.averageVolume),
        profitMargin: raw(fd.profitMargins) ?? raw(ks.profitMargins),
        revenueGrowth: raw(fd.revenueGrowth),
      },
      annual,
      quarterly,
    };
  },

  async etfDetails(symbol): Promise<EtfDetails> {
    const s: any = await yahooFinance.quoteSummary(
      symbol,
      { modules: ["price", "summaryDetail", "defaultKeyStatistics", "fundProfile", "topHoldings", "fundPerformance", "assetProfile"] },
      NO_VALIDATE,
    );
    const price = s.price ?? {};
    const sd = s.summaryDetail ?? {};
    const ks = s.defaultKeyStatistics ?? {};
    const fp = s.fundProfile ?? {};
    const th = s.topHoldings ?? {};
    const perf = s.fundPerformance ?? {};
    const sectors = (th.sectorWeightings ?? []).flatMap((o: any) =>
      Object.entries(o).map(([sector, w]) => ({ sector, weight: raw(w) ?? 0 })),
    );
    return {
      quote: mapQuote({ ...price, symbol: price.symbol ?? symbol }),
      description: s.assetProfile?.longBusinessSummary ?? ks.longBusinessSummary,
      fundFamily: fp.family ?? ks.fundFamily,
      category: fp.categoryName ?? ks.category,
      expenseRatio:
        raw(fp.feesExpensesInvestment?.annualReportExpenseRatio) ??
        raw(ks.annualReportExpenseRatio) ??
        raw(sd.expenseRatio),
      totalAssets: raw(sd.totalAssets) ?? raw(ks.totalAssets),
      dividendYield: raw(sd.yield) ?? raw(sd.trailingAnnualDividendYield),
      inceptionDate: toDate(ks.fundInceptionDate),
      beta3y: raw(ks.beta3Year),
      holdings: (th.holdings ?? []).map((h: any) => ({
        symbol: h.symbol,
        name: h.holdingName ?? h.symbol,
        weight: raw(h.holdingPercent) ?? 0,
      })),
      sectors: sectors.filter((x: { weight: number }) => x.weight > 0).sort((a: any, b: any) => b.weight - a.weight),
      annualReturns: (perf.annualTotalReturns?.returns ?? [])
        .map((r: any) => ({ year: Number(r.year), value: raw(r.annualValue) }))
        .filter((r: any) => r.value != null && Number.isFinite(r.year))
        .sort((a: any, b: any) => a.year - b.year)
        .slice(-10),
    };
  },
};
