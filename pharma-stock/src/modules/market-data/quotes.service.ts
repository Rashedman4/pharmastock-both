import { FinancialModelingPrepProvider } from "./financial-modeling-prep.provider";
import { PriceCacheService } from "./price-cache.service";
import { QuoteResult } from "./provider.interface";

// How long a price_cache row is trusted before it's considered stale enough
// to warrant a fresh provider call. Matches the sibling
// SimplePriceCacheService's FRESH_FOR_MS, for consistency across the two
// price-cache implementations in this codebase.
const FRESH_FOR_MS = 60 * 1000;

/**
 * QuotesService orchestrates the retrieval of live market quotes and
 * persistence into the cache. It uses a designated provider for
 * external data and writes into the `price_cache` table via the
 * PriceCacheService. It reads the cache first and only calls the
 * provider for symbols that are missing or stale, so repeated requests
 * for the same symbol within FRESH_FOR_MS reuse the cached value instead
 * of hitting the external API again.
 */
export class QuotesService {
  private provider: FinancialModelingPrepProvider;
  private cache: PriceCacheService;

  constructor() {
    this.provider = new FinancialModelingPrepProvider();
    this.cache = new PriceCacheService();
  }

  /**
   * Get quote information for the supplied symbols. Cached entries newer
   * than FRESH_FOR_MS are reused as-is; anything missing or older than
   * that is re-fetched from the provider and the cache is updated.
   * Symbols that are duplicated will be de‑duplicated before fetching.
   */
  async getQuotes(symbols: string[]): Promise<QuoteResult[]> {
    const uniqueSymbols = Array.from(new Set(symbols.filter(Boolean)));
    if (uniqueSymbols.length === 0) return [];

    let cachedBySymbol = new Map<string, QuoteResult>();
    try {
      const cached = await this.cache.getCachedPrices(uniqueSymbols);
      cachedBySymbol = new Map(cached.map((quote) => [quote.symbol, quote]));
    } catch (err) {
      // A cache-read failure shouldn't block serving fresh quotes — just
      // treat everything as stale and fetch from the provider below.
      console.error('Failed to read price cache:', err);
    }

    const now = Date.now();
    const staleSymbols = uniqueSymbols.filter((symbol) => {
      const entry = cachedBySymbol.get(symbol);
      if (!entry) return true;
      const asOf = entry.asOf ? new Date(entry.asOf).getTime() : NaN;
      return !Number.isFinite(asOf) || now - asOf > FRESH_FOR_MS;
    });

    if (staleSymbols.length === 0) {
      return uniqueSymbols
        .map((symbol) => cachedBySymbol.get(symbol))
        .filter((quote): quote is QuoteResult => Boolean(quote));
    }

    // Fetch fresh quotes only for what's missing/stale
    const fresh = await this.provider.getQuotes(staleSymbols);
    // Persist into cache for future use
    try {
      await this.cache.upsertPrices(fresh);
    } catch (err) {
      // Do not fail the entire operation if cache persistence fails
      console.error('Failed to persist quotes to cache:', err);
    }

    const freshBySymbol = new Map(fresh.map((quote) => [quote.symbol, quote]));
    return uniqueSymbols
      .map((symbol) => freshBySymbol.get(symbol) ?? cachedBySymbol.get(symbol))
      .filter((quote): quote is QuoteResult => Boolean(quote));
  }
}