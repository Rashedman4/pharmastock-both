import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { unstable_cache } from "next/cache";
import { refreshSignalPricesIfStale } from "@/modules/market-data/signal-price-refresh.service";

// Cache key and revalidation time
const CACHE_KEY = "signals";
const CACHE_TIME = 30; // 30 seconds

// Cached read, backed by the shared (web + mobile) throttled price refresh.
const getSignals = unstable_cache(
  async () => {
    await refreshSignalPricesIfStale();
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM signals ORDER BY date_opened DESC"
      );
      return result.rows;
    } finally {
      client.release();
    }
  },
  [CACHE_KEY],
  { revalidate: CACHE_TIME }
);

// GET handler
export const GET = async () => {
  try {
    const data = await getSignals();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// POST handler for updating prices and auto-closing signals
/* export async function POST() {
  try {
    const client = await pool.connect();
    const query = `SELECT * FROM signals`;
    const result = await client.query(query);

    // Update prices and check targets for each signal
    const updatedSignals = await Promise.all(
      result.rows.map(async (signal) => {
        try {
          const currentPrice = await fetchCurrentPrice(signal.symbol);

          // Update the price
          const updateQuery = `
            UPDATE signals
            SET price_now = $1
            WHERE id = $2
            RETURNING *;
          `;
          const updateResult = await client.query(updateQuery, [
            currentPrice,
            signal.id,
          ]);

          // Check if target is reached
          if (currentPrice >= signal.first_target) {
            // Close the signal if first target is reached
            const success = signal.enter_price < currentPrice;
            const historyQuery = `
              INSERT INTO signal_history (symbol, entrance_date, closing_date, in_price, out_price, success)
              VALUES ($1, $2, CURRENT_DATE, $3, $4, $5);
            `;
            await client.query(historyQuery, [
              signal.symbol,
              signal.date_opened,
              signal.enter_price,
              currentPrice,
              success,
            ]);

            // Delete the signal
            await client.query("DELETE FROM signals WHERE id = $1", [
              signal.id,
            ]);
            return null; // Signal closed, don't include in response
          }

          return updateResult.rows[0];
        } catch (error) {
          console.error(`Error updating signal ${signal.id}:`, error);
          return signal; // Return original signal if update fails
        }
      })
    );

    client.release();

    // Filter out null values (closed signals)
    const activeSignals = updatedSignals.filter((signal) => signal !== null);

    // Revalidate the signals route
    revalidatePath("/api/signals");
    revalidatePath("/api/signalHistory");

    return NextResponse.json(activeSignals, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating signals: " + error },
      { status: 500 }
    );
  }
}
 */
