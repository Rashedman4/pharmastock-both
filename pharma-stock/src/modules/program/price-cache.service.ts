import pool from "@/lib/db";
import { FinancialModelingPrepProvider } from "@/modules/market-data/financial-modeling-prep.provider";

export interface SimpleQuote {
  symbol: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  marketStatus: string;
  fetchedAt: string;
}

const FRESH_FOR_MS = 1 * 60 * 1000;

export class SimplePriceCacheService {
  private provider = new FinancialModelingPrepProvider();

  async getQuotes(symbols: string[]): Promise<Record<string, SimpleQuote>> {
    const uniqueSymbols = Array.from(
      new Set(
        symbols
          .map((symbol) =>
            String(symbol || "")
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean),
      ),
    );

    if (uniqueSymbols.length === 0) {
      return {};
    }

    const cached = await pool.query(
      `SELECT symbol,
              current_price,
              previous_close_price,
              change_amount,
              change_percent,
              market_status,
              fetched_at
       FROM price_cache_simple
       WHERE symbol = ANY($1::text[])`,
      [uniqueSymbols],
    );

    const now = Date.now();
    const quoteMap: Record<string, SimpleQuote> = {};
    const staleSymbols: string[] = [];

    for (const symbol of uniqueSymbols) {
      const row = cached.rows.find((entry) => entry.symbol === symbol);
      if (!row) {
        staleSymbols.push(symbol);
        continue;
      }

      const fetchedAt = new Date(row.fetched_at).getTime();
      if (!Number.isFinite(fetchedAt) || now - fetchedAt > FRESH_FOR_MS) {
        staleSymbols.push(symbol);
      }

      quoteMap[symbol] = {
        symbol,
        price: Number(row.current_price),
        previousClose:
          row.previous_close_price == null
            ? null
            : Number(row.previous_close_price),
        change: row.change_amount == null ? null : Number(row.change_amount),
        changePercent:
          row.change_percent == null ? null : Number(row.change_percent),
        marketStatus: row.market_status ?? "UNKNOWN",
        fetchedAt: new Date(row.fetched_at).toISOString(),
      };
    }

    if (staleSymbols.length > 0) {
      try {
        const fresh = await this.provider.getQuotes(staleSymbols);
        if (fresh.length > 0) {
          const client = await pool.connect();
          try {
            await client.query("BEGIN");
            for (const quote of fresh) {
              await client.query(
                `INSERT INTO price_cache_simple (
                   symbol,
                   provider,
                   current_price,
                   previous_close_price,
                   change_amount,
                   change_percent,
                   currency,
                   market_status,
                   fetched_at,
                   raw_payload,
                   updated_at
                 ) VALUES ($1, 'FMP', $2, $3, $4, $5, 'USD', 'UNKNOWN', NOW(), $6, NOW())
                 ON CONFLICT (symbol) DO UPDATE
                 SET current_price = EXCLUDED.current_price,
                     previous_close_price = EXCLUDED.previous_close_price,
                     change_amount = EXCLUDED.change_amount,
                     change_percent = EXCLUDED.change_percent,
                     provider = EXCLUDED.provider,
                     fetched_at = NOW(),
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = NOW()`,
                [
                  quote.symbol.toUpperCase(),
                  quote.price,
                  quote.previousClose ?? null,
                  quote.change ?? null,
                  quote.changePercent ?? null,
                  JSON.stringify(quote),
                ],
              );

              quoteMap[quote.symbol.toUpperCase()] = {
                symbol: quote.symbol.toUpperCase(),
                price: Number(quote.price),
                previousClose: quote.previousClose ?? null,
                change: quote.change ?? null,
                changePercent: quote.changePercent ?? null,
                marketStatus: "UNKNOWN",
                fetchedAt: new Date().toISOString(),
              };
            }
            await client.query("COMMIT");
          } catch (error) {
            await client.query("ROLLBACK");
            throw error;
          } finally {
            client.release();
          }
        }
      } catch (error) {
        console.error(
          "Failed to refresh quotes for simple price cache:",
          error,
        );
      }
    }

    return quoteMap;
  }
}
