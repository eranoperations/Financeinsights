import type { AssetType } from "./types";

/**
 * Static reference list of well-known assets. Used to build the category tabs on
 * the insights page and as the universe for the demo (mock) data provider.
 */
export interface CatalogEntry {
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  exchange: string;
  sector?: string;
  /** Approximate values used only by the demo data provider. */
  basePrice: number;
  marketCap?: number;
  dividendYield?: number;
  expenseRatio?: number;
}

export const CATALOG: CatalogEntry[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 217, marketCap: 5.24e12, dividendYield: 0.0002 },
  { symbol: "AAPL", name: "Apple Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 342, marketCap: 4.99e12, dividendYield: 0.0031 },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 539, marketCap: 4.01e12, dividendYield: 0.0065 },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Communication Services", basePrice: 349, marketCap: 4.25e12, dividendYield: 0.0024 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Consumer Cyclical", basePrice: 254, marketCap: 2.75e12 },
  { symbol: "META", name: "Meta Platforms, Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Communication Services", basePrice: 720, marketCap: 1.81e12, dividendYield: 0.0029 },
  { symbol: "AVGO", name: "Broadcom Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 344, marketCap: 1.62e12, dividendYield: 0.0068 },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Consumer Cyclical", basePrice: 430, marketCap: 1.38e12 },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Financial Services", basePrice: 490, marketCap: 1.06e12 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Financial Services", basePrice: 305, marketCap: 8.4e11, dividendYield: 0.0195 },
  { symbol: "V", name: "Visa Inc.", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Financial Services", basePrice: 345, marketCap: 6.7e11, dividendYield: 0.0068 },
  { symbol: "LLY", name: "Eli Lilly and Company", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Healthcare", basePrice: 820, marketCap: 7.4e11, dividendYield: 0.0073 },
  { symbol: "COST", name: "Costco Wholesale Corporation", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Consumer Defensive", basePrice: 930, marketCap: 4.1e11, dividendYield: 0.0056 },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 178, marketCap: 4.2e11 },
  { symbol: "NFLX", name: "Netflix, Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Communication Services", basePrice: 1210, marketCap: 5.1e11 },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 235, marketCap: 3.8e11 },
  { symbol: "KO", name: "The Coca-Cola Company", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Consumer Defensive", basePrice: 69, marketCap: 3.0e11, dividendYield: 0.0295 },
  { symbol: "PG", name: "The Procter & Gamble Company", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Consumer Defensive", basePrice: 152, marketCap: 3.6e11, dividendYield: 0.0275 },
  { symbol: "JNJ", name: "Johnson & Johnson", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Healthcare", basePrice: 190, marketCap: 4.6e11, dividendYield: 0.0272 },
  { symbol: "PEP", name: "PepsiCo, Inc.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Consumer Defensive", basePrice: 148, marketCap: 2.0e11, dividendYield: 0.0385 },
  { symbol: "XOM", name: "Exxon Mobil Corporation", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Energy", basePrice: 114, marketCap: 4.9e11, dividendYield: 0.0345 },
  { symbol: "O", name: "Realty Income Corporation", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Real Estate", basePrice: 58, marketCap: 5.3e10, dividendYield: 0.055 },
  { symbol: "ABBV", name: "AbbVie Inc.", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Healthcare", basePrice: 225, marketCap: 4.0e11, dividendYield: 0.029 },
  { symbol: "TEVA", name: "Teva Pharmaceutical Industries", type: "EQUITY", currency: "USD", exchange: "NYSE", sector: "Healthcare", basePrice: 19, marketCap: 2.2e10 },
  { symbol: "NICE", name: "NICE Ltd.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 150, marketCap: 9.5e9 },
  { symbol: "CHKP", name: "Check Point Software Technologies", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 205, marketCap: 2.2e10 },
  { symbol: "ESLT", name: "Elbit Systems Ltd.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Industrials", basePrice: 480, marketCap: 2.1e10, dividendYield: 0.006 },
  { symbol: "MNDY", name: "monday.com Ltd.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 210, marketCap: 1.1e10 },
  { symbol: "WIX", name: "Wix.com Ltd.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 160, marketCap: 9e9 },
  { symbol: "CYBR", name: "CyberArk Software Ltd.", type: "EQUITY", currency: "USD", exchange: "NASDAQ", sector: "Technology", basePrice: 480, marketCap: 2.4e10 },
  { symbol: "LUMI.TA", name: "Bank Leumi Le-Israel", type: "EQUITY", currency: "ILA", exchange: "TLV", sector: "Financial Services", basePrice: 6400, marketCap: 9.5e10, dividendYield: 0.045 },
  { symbol: "POLI.TA", name: "Bank Hapoalim", type: "EQUITY", currency: "ILA", exchange: "TLV", sector: "Financial Services", basePrice: 6800, marketCap: 9.0e10, dividendYield: 0.042 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "ETF", currency: "USD", exchange: "NYSE Arca", basePrice: 665, dividendYield: 0.0112, expenseRatio: 0.000945 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", type: "ETF", currency: "USD", exchange: "NYSE Arca", basePrice: 612, dividendYield: 0.0118, expenseRatio: 0.0003 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "ETF", currency: "USD", exchange: "NASDAQ", basePrice: 600, dividendYield: 0.0047, expenseRatio: 0.002 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", currency: "USD", exchange: "NYSE Arca", basePrice: 325, dividendYield: 0.0115, expenseRatio: 0.0003 },
  { symbol: "SCHD", name: "Schwab U.S. Dividend Equity ETF", type: "ETF", currency: "USD", exchange: "NYSE Arca", basePrice: 27, dividendYield: 0.038, expenseRatio: 0.0006 },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", type: "ETF", currency: "USD", exchange: "NASDAQ", basePrice: 72, dividendYield: 0.028, expenseRatio: 0.0005 },
  { symbol: "VT", name: "Vanguard Total World Stock ETF", type: "ETF", currency: "USD", exchange: "NYSE Arca", basePrice: 135, dividendYield: 0.0175, expenseRatio: 0.0006 },
  { symbol: "EIS", name: "iShares MSCI Israel ETF", type: "ETF", currency: "USD", exchange: "NYSE Arca", basePrice: 95, dividendYield: 0.012, expenseRatio: 0.0059 },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", currency: "USD", exchange: "NASDAQ", basePrice: 74, dividendYield: 0.037, expenseRatio: 0.0003 },
  { symbol: "^GSPC", name: "S&P 500", type: "INDEX", currency: "USD", exchange: "SNP", basePrice: 6650 },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", type: "INDEX", currency: "USD", exchange: "DJI", basePrice: 46200 },
  { symbol: "^IXIC", name: "NASDAQ Composite", type: "INDEX", currency: "USD", exchange: "NASDAQ", basePrice: 22600 },
  { symbol: "TA35.TA", name: 'ת"א 35', type: "INDEX", currency: "ILS", exchange: "TLV", basePrice: 3300 },
  { symbol: "USDILS=X", name: "USD/ILS", type: "CURRENCY", currency: "ILS", exchange: "CCY", basePrice: 3.3 },
  { symbol: "ILSUSD=X", name: "ILS/USD", type: "CURRENCY", currency: "USD", exchange: "CCY", basePrice: 0.303 },
];

export const CATALOG_BY_SYMBOL = new Map(CATALOG.map((e) => [e.symbol, e]));

export interface Category {
  id: string;
  label: string;
  symbols: string[];
}

export const CATEGORIES: Category[] = [
  { id: "sp500", label: "S&P 500", symbols: ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "TSLA", "BRK-B", "JPM", "LLY", "V"] },
  { id: "trending", label: "הכי חמות", symbols: ["PLTR", "NVDA", "TSLA", "AMD", "NFLX", "META", "AVGO"] },
  { id: "growth", label: "צמיחה", symbols: ["NVDA", "PLTR", "AMD", "NFLX", "AVGO", "MNDY", "CYBR"] },
  { id: "dividend", label: "דיבידנד", symbols: ["KO", "PG", "JNJ", "PEP", "XOM", "O", "ABBV", "JPM"] },
  { id: "etf", label: "תעודות סל", symbols: ["SPY", "VOO", "QQQ", "VTI", "SCHD", "VXUS", "VT", "BND", "EIS"] },
  { id: "israel", label: "ישראל", symbols: ["TEVA", "NICE", "CHKP", "ESLT", "MNDY", "WIX", "CYBR", "LUMI.TA", "POLI.TA"] },
];

/** Benchmarks offered for portfolio comparison and the header strip. */
export const BENCHMARKS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "נאסד״ק" },
  { symbol: "^DJI", label: "דאו ג׳ונס" },
  { symbol: "TA35.TA", label: "ת״א 35" },
] as const;
