import { MarketDataProvider, QuoteResult } from "./provider.interface";

/**
 * Implementation of the MarketDataProvider interface using the
 * Financial Modeling Prep (FMP) API. This provider fetches short quote
 * information for each requested symbol. It leverages the same endpoint
 * currently used for real‑time signal pricing in the existing app
 * (`quote-short`), ensuring a consistent data source across features.
 */
export class FinancialModelingPrepProvider
  implements MarketDataProvider
{
  async getQuotes(symbols: string[]): Promise<QuoteResult[]> {
    const results: QuoteResult[] = [];

    // Use Promise.all to fetch quotes concurrently. The API returns
    // arrays of objects with `symbol` and `price` fields. If a symbol
    // cannot be resolved or the response body is empty, it will be
    // silently skipped to avoid propagating incomplete data.
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const url = `https://financialmodelingprep.com/api/v3/quote-short/${encodeURIComponent(
            symbol
          )}?apikey=${process.env.MY_API_KEY}`;
          const res = await fetch(url);
          if (!res.ok) {
            console.error(
              `FMP API responded with status ${res.status} for symbol ${symbol}`
            );
            return;
          }
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const entry = data[0];
            results.push({
              symbol: entry.symbol ?? symbol,
              price: typeof entry.price === "number" ? entry.price : 0,
              // The short quote endpoint does not provide previous close or change
              previousClose: null,
              change: null,
              changePercent: null,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch FMP quote for ${symbol}:`, err);
        }
      })
    );
    return results;
  }
}