import pool from "@/lib/db";
import { QuoteResult } from "./provider.interface";

/**
 * Service responsible for persisting and retrieving price data from the
 * `price_cache` table. The cache stores the latest known prices along
 * with timestamps and payload metadata. This service exposes helper
 * functions to query existing cached values and to upsert new records.
 */
export class PriceCacheService {
  /**
   * Retrieve cached price entries for the specified symbols. Symbols that
   * have no matching record will not appear in the returned array.
   */
  async getCachedPrices(symbols: string[]): Promise<QuoteResult[]> {
    if (symbols.length === 0) return [];
    const client = await pool.connect();
    try {
      const params: string[] = symbols;
      const placeholders = params.map((_, i) => `$${i + 1}`).join(",");
      const query = `SELECT symbol, price, previous_close as "previousClose", change_amount as "change", change_percent as "changePercent", as_of FROM price_cache WHERE symbol IN (${placeholders})`;
      const res = await client.query(query, params);
      return res.rows.map((row) => ({
        symbol: row.symbol,
        price: Number(row.price),
        previousClose: row.previousClose ? Number(row.previousClose) : null,
        change: row.change ? Number(row.change) : null,
        changePercent: row.changePercent ? Number(row.changePercent) : null,
      })) as QuoteResult[];
    } finally {
      client.release();
    }
  }

  /**
   * Upsert quote values into the `price_cache` table. For each quote
   * result the row will either be inserted or updated if it already
   * exists. The `as_of` timestamp will be set to the current time.
   */
  async upsertPrices(quotes: QuoteResult[]): Promise<void> {
    if (quotes.length === 0) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const quote of quotes) {
        // Use ON CONFLICT to upsert by symbol.
        await client.query(
          `
            INSERT INTO price_cache (symbol, price, previous_close, change_amount, change_percent, provider, as_of, raw_payload)
            VALUES ($1, $2, $3, $4, $5, 'FMP', NOW(), $6)
            ON CONFLICT (symbol) DO UPDATE
              SET price = EXCLUDED.price,
                  previous_close = EXCLUDED.previous_close,
                  change_amount = EXCLUDED.change_amount,
                  change_percent = EXCLUDED.change_percent,
                  provider = 'FMP',
                  as_of = NOW(),
                  raw_payload = EXCLUDED.raw_payload,
                  updated_at = NOW()
          `,
          [
            quote.symbol,
            quote.price,
            quote.previousClose ?? null,
            quote.change ?? null,
            quote.changePercent ?? null,
            // Store raw_payload as minimal object to record the price; actual payload is small for quote-short
            JSON.stringify({ price: quote.price }),
          ]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to upsert price cache:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}