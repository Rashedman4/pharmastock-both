import pool from "@/lib/db";
import { QuotesService } from "./quotes.service";

/**
 * Signals are re-priced at most this often. Both the web and mobile signals
 * routes call `refreshSignalPricesIfStale()` on every read; this timestamp
 * (persisted in `system_settings`) is what keeps that from hammering the
 * market data provider on every request from every client.
 */
const PRICE_UPDATE_INTERVAL_SECONDS = 120;
const LAST_UPDATE_KEY = "last_price_update";

const quotesService = new QuotesService();

/**
 * Re-prices all open signals from the market data provider if the last
 * refresh is older than PRICE_UPDATE_INTERVAL_SECONDS, and auto-closes any
 * signal whose first target has been hit (moving it into signal_history).
 * No-ops quickly (a single SELECT) when the last refresh is still fresh.
 *
 * Shared by both the web (`/api/signals`) and mobile (`/api/mobile/v1/signals*`)
 * routes so neither client depends on the other's traffic to stay fresh.
 */
export async function refreshSignalPricesIfStale(): Promise<void> {
  const client = await pool.connect();
  try {
    const lastUpdateResult = await client.query(
      `SELECT value FROM system_settings WHERE key = $1`,
      [LAST_UPDATE_KEY]
    );
    const lastUpdate = lastUpdateResult.rows[0]?.value
      ? new Date(lastUpdateResult.rows[0].value)
      : new Date(0);
    const secondsSinceUpdate = (Date.now() - lastUpdate.getTime()) / 1000;

    if (secondsSinceUpdate < PRICE_UPDATE_INTERVAL_SECONDS) {
      return;
    }

    // Mark the refresh as claimed before doing the (slower) provider call, so
    // requests that arrive while this one is in flight see a fresh timestamp
    // and skip rather than piling on duplicate provider calls.
    await client.query(
      `INSERT INTO system_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [LAST_UPDATE_KEY, new Date().toISOString()]
    );

    const signalsResult = await client.query(`SELECT * FROM signals`);
    const signals = signalsResult.rows;
    if (signals.length === 0) return;

    const symbols = signals.map((s) => s.symbol);
    const quotes = await quotesService.getQuotes(symbols);
    const priceBySymbol = new Map(quotes.map((q) => [q.symbol, q.price]));

    for (const signal of signals) {
      const currentPrice = priceBySymbol.get(signal.symbol);
      if (currentPrice == null) continue; // provider didn't return this symbol this round

      await client.query(`UPDATE signals SET price_now = $1 WHERE id = $2`, [
        currentPrice,
        signal.id,
      ]);

      if (signal.first_target != null && currentPrice >= signal.first_target) {
        const success = signal.enter_price < currentPrice;
        await client.query(
          `INSERT INTO signal_history
             (symbol, entrance_date, closing_date, in_price, out_price, success, reason_en, reason_ar)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)`,
          [
            signal.symbol,
            signal.date_opened,
            signal.enter_price,
            currentPrice,
            success,
            signal.reason_en,
            signal.reason_ar,
          ]
        );
        await client.query(`DELETE FROM signals WHERE id = $1`, [signal.id]);
      }
    }
  } catch (err) {
    // A failed price refresh should never break a signals read.
    console.error("[signal-price-refresh] failed:", err);
  } finally {
    client.release();
  }
}
