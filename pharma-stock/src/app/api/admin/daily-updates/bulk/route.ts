import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import { ensureStocks } from "@/modules/stocks/stocks.service";
import {
  logAlertFailure,
  notifyAllDailyUpdates,
} from "@/lib/services/content-alert.service";
import { todayInAppTimezone } from "@/lib/mobile/day-window";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const updateItems = await req.json();
    if (!Array.isArray(updateItems)) {
      return NextResponse.json(
        { error: "Input must be an array" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await ensureStocks(
        client,
        updateItems.map((item) => ({ symbol: item.symbol }))
      );

      const insertQuery = `
  INSERT INTO daily_updates (symbol, subtitle_en, subtitle_ar, description_en, description_ar, created_by, published_date)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *;
`;

      const results = [];
      for (const item of updateItems) {
        const publishedDate = new Date().toISOString();
        const result = await client.query(insertQuery, [
          item.symbol,
          item.subtitle?.en || null,
          item.subtitle?.ar || null,
          item.description.en,
          item.description.ar,
          auth.userId,
          publishedDate,
        ]);
        results.push(result.rows[0]);
      }

      await client.query("COMMIT");

      // Exactly ONE notification per user for the whole batch — never one per
      // row — fired after COMMIT and fire-and-forget. See PROJECT_CONTEXT §7.
      void notifyAllDailyUpdates({
        date: todayInAppTimezone(),
        symbols: results.map((row) => row.symbol),
      }).catch(logAlertFailure("daily-updates bulk (" + results.length + " rows)"));

      return NextResponse.json(results, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding daily updates. error: " + error },
      { status: 500 }
    );
  }
}
