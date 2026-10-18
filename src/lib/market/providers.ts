import { mockProvider } from "./mock";
import { yahooProvider } from "./yahoo";
import type { MarketDataProvider } from "./types";

/**
 * Every available market data source, keyed by the name used in MARKET_DATA_PROVIDER.
 * To add a source: implement MarketDataProvider in its own file and register it here.
 */
export const PROVIDERS: Record<string, MarketDataProvider> = {
  yahoo: yahooProvider,
  mock: mockProvider,
};

export const DEFAULT_PROVIDER = "yahoo";

export { mockProvider };

/** Resolves a provider by name; unknown or empty names fall back to the default. */
export function resolveProvider(name: string | undefined): MarketDataProvider {
  const key = (name ?? "").trim().toLowerCase() || DEFAULT_PROVIDER;
  const provider = PROVIDERS[key];
  if (provider) return provider;
  console.warn(`[market] unknown MARKET_DATA_PROVIDER "${name}", using ${DEFAULT_PROVIDER}`);
  return PROVIDERS[DEFAULT_PROVIDER];
}
