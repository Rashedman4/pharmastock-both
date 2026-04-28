import { FinancialModelingPrepProvider } from "./financial-modeling-prep.provider";
import { PriceCacheService } from "./price-cache.service";
import { QuoteResult } from "./provider.interface";

/**
 * QuotesService orchestrates the retrieval of live market quotes and
 * persistence into the cache. It uses a designated provider for
 * external data and writes into the `price_cache` table via the
 * PriceCacheService. In its current form the service always fetches
 * fresh quotes for the requested symbols, but it persists the result to
 * reduce load on subsequent requests. A future enhancement could read
 * from the cache first and only fetch what is expired.
 */
export class QuotesService {
  private provider: FinancialModelingPrepProvider;
  private cache: PriceCacheService;

  constructor() {
    this.provider = new FinancialModelingPrepProvider();
    this.cache = new PriceCacheService();
  }

  /**
   * Get quote information for the supplied symbols. The service fetches
   * fresh prices from the external provider and stores them in the cache.
   * Symbols that are duplicated will be de‑duplicated before fetching.
   */
  async getQuotes(symbols: string[]): Promise<QuoteResult[]> {
    const uniqueSymbols = Array.from(new Set(symbols.filter(Boolean)));
    if (uniqueSymbols.length === 0) return [];
    // Fetch fresh quotes
    const quotes = await this.provider.getQuotes(uniqueSymbols);
    // Persist into cache for future use
    try {
      await this.cache.upsertPrices(quotes);
    } catch (err) {
      // Do not fail the entire operation if cache persistence fails
      console.error('Failed to persist quotes to cache:', err);
    }
    return quotes;
  }
}