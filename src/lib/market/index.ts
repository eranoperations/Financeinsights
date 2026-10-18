import "server-only";
import { mockProvider, resolveProvider } from "./providers";
import type { HistoryRange, MarketDataProvider } from "./types";

export * from "./types";

/** Result wrapper: `demo` is true when the data came from the synthetic provider. */
export interface Sourced<T> {
  data: T;
  demo: boolean;
}

const TTL_MS = {
  search: 10 * 60_000,
  quotes: 60_000,
  history: 15 * 60_000,
  details: 60 * 60_000,
};

const cache = new Map<string, { expires: number; value: Sourced<unknown> }>();
const MAX_CACHE_ENTRIES = 500;

function primary(): MarketDataProvider {
  return resolveProvider(process.env.MARKET_DATA_PROVIDER);
}

async function cached<T>(
  key: string,
  ttl: number,
  run: (p: MarketDataProvider) => Promise<T>,
): Promise<Sourced<T>> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Sourced<T>;

  const p = primary();
  let value: Sourced<T>;
  try {
    value = { data: await run(p), demo: p === mockProvider };
  } catch (err) {
    if (p === mockProvider) throw err;
    console.warn(`[market] ${p.name} failed for ${key}, using demo data:`, (err as Error).message);
    value = { data: await run(mockProvider), demo: true };
  }
  // Live failures are cached briefly so a flaky upstream is retried soon.
  cache.set(key, { expires: Date.now() + (value.demo && p !== mockProvider ? 60_000 : ttl), value });
  if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
  return value;
}

export const market = {
  search: (q: string) => cached(`search:${q.toLowerCase()}`, TTL_MS.search, (p) => p.search(q)),
  quotes: (symbols: string[]) =>
    cached(`quotes:${[...symbols].sort().join(",")}`, TTL_MS.quotes, (p) => p.quotes(symbols)),
  history: (symbol: string, range: HistoryRange | { from: string }) =>
    cached(`history:${symbol}:${typeof range === "string" ? range : range.from}`, TTL_MS.history, (p) =>
      p.history(symbol, range),
    ),
  stockDetails: (symbol: string) => cached(`stock:${symbol}`, TTL_MS.details, (p) => p.stockDetails(symbol)),
  etfDetails: (symbol: string) => cached(`etf:${symbol}`, TTL_MS.details, (p) => p.etfDetails(symbol)),
};
