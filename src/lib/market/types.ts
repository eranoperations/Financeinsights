export type AssetType = "EQUITY" | "ETF" | "INDEX" | "MUTUALFUND" | "CRYPTO" | "CURRENCY" | "OTHER";

export interface Quote {
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  exchange?: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
}

export interface PricePoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface DividendEvent {
  date: string; // YYYY-MM-DD (ex-date)
  amount: number;
}

export interface History {
  prices: PricePoint[];
  dividends: DividendEvent[];
}

export type HistoryRange = "1mo" | "6mo" | "1y" | "5y" | "max";

export interface FinancialPeriod {
  period: string; // e.g. "2024" or "2024-Q3"
  date: string;
  revenue?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  operatingExpense?: number;
  totalExpenses?: number;
  operatingIncome?: number;
  netIncome?: number;
  eps?: number;
  freeCashFlow?: number;
}

export interface StockProfile {
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  employees?: number;
  country?: string;
}

export interface KeyStats {
  marketCap?: number;
  peRatio?: number;
  forwardPe?: number;
  eps?: number;
  dividendYield?: number; // fraction, e.g. 0.012
  dividendRate?: number;
  payoutRatio?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  avgVolume?: number;
  profitMargin?: number;
  revenueGrowth?: number;
}

export interface StockDetails {
  quote: Quote;
  profile: StockProfile;
  stats: KeyStats;
  annual: FinancialPeriod[];
  quarterly: FinancialPeriod[];
}

export interface EtfHolding {
  symbol?: string;
  name: string;
  weight: number; // fraction
}

export interface EtfDetails {
  quote: Quote;
  description?: string;
  fundFamily?: string;
  category?: string;
  expenseRatio?: number; // fraction, e.g. 0.0009
  totalAssets?: number;
  dividendYield?: number; // fraction
  inceptionDate?: string;
  beta3y?: number;
  holdings: EtfHolding[];
  sectors: { sector: string; weight: number }[];
  annualReturns: { year: number; value: number }[];
}

export interface MarketDataProvider {
  readonly name: string;
  search(query: string): Promise<SearchResult[]>;
  quotes(symbols: string[]): Promise<Quote[]>;
  history(symbol: string, range: HistoryRange | { from: string }): Promise<History>;
  stockDetails(symbol: string): Promise<StockDetails>;
  etfDetails(symbol: string): Promise<EtfDetails>;
}
