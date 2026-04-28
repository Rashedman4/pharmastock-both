export interface QuoteResult {
  symbol: string;
  price: number;
  previousClose?: number | null;
  change?: number | null;
  changePercent?: number | null;
}

/**
 * Market data providers must implement this interface. Providers are
 * responsible for fetching quote information for one or more symbols from
 * their underlying API and returning a uniform structure. Implementation
 * should throw on unexpected failures to allow callers to handle errors.
 */
export interface MarketDataProvider {
  /**
   * Fetch quote information for the given symbols. It is the provider's
   * responsibility to batch requests and map raw payloads to the
   * `QuoteResult` structure. Symbols that cannot be resolved should be
   * omitted from the returned array.
   */
  getQuotes(symbols: string[]): Promise<QuoteResult[]>;
}