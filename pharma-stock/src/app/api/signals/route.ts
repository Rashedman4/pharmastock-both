import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { unstable_cache } from "next/cache";
//import { revalidatePath } from "next/cache";

// Cache key and revalidation time
const CACHE_KEY = "signals";
const CACHE_TIME = 30; // 30 seconds
const PRICE_UPDATE_INTERVAL = 2 * 60; // 5 minutes in seconds

// Function to fetch current price
async function fetchCurrentPrice(symbol: string) {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${process.env.MY_API_KEY}`
    );
    const data = await response.json();
    return data[0].price;
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }
}

// Function to update signal prices and check targets
async function updateSignalPrices() {
  const client = await pool.connect();
  try {
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
              INSERT INTO signal_history (symbol, entrance_date, closing_date, in_price, out_price, success,reason_en,reason_ar)
              VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7);
            `;
            await client.query(historyQuery, [
              signal.symbol,
              signal.date_opened,
              signal.enter_price,
              currentPrice,
              success,
              signal.reason_en,
              signal.reason_ar,
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

    // Filter out null values (closed signals)
    const activeSignals = updatedSignals.filter((signal) => signal !== null);
    return activeSignals;
  } finally {
    client.release();
  }
}

// Cached function with price updates
const getSignals = unstable_cache(
  async () => {
    const client = await pool.connect();
    try {
      // Get the last update time
      const lastUpdateQuery = `
        SELECT value FROM system_settings 
        WHERE key = 'last_price_update'
      `;
      const lastUpdateResult = await client.query(lastUpdateQuery);
      const lastUpdate = lastUpdateResult.rows[0]?.value
        ? new Date(lastUpdateResult.rows[0].value)
        : new Date(0);

      // Check if we need to update prices
      const now = new Date();
      const timeSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;

      let signals;
      if (timeSinceLastUpdate >= PRICE_UPDATE_INTERVAL) {
        // Update prices
        signals = await updateSignalPrices();

        // Update the last update time
        await client.query(
          `
          INSERT INTO system_settings (key, value)
          VALUES ('last_price_update', $1)
          ON CONFLICT (key) DO UPDATE
          SET value = $1
        `,
          [now.toISOString()]
        );
      } else {
        // Just get the current signals
        const result = await client.query(
          "SELECT * FROM signals ORDER BY date_opened DESC"
        );
        signals = result.rows;
      }

      return signals;
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
