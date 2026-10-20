import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import { ensureStocks, normalizeSymbol } from "@/modules/stocks/stocks.service";
import {
  formatSymbolList,
  logAlertFailure,
  notifyWatchers,
} from "@/lib/services/content-alert.service";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const breakthroughs = await req.json();
    if (!Array.isArray(breakthroughs)) {
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
        breakthroughs.map((item) => ({ symbol: item.symbol, name: item.company }))
      );

      const insertQuery = `
        INSERT INTO breakthroughs (
          title_en, title_ar, company, symbol,
          description_en, description_ar,
          potential_impact_en, potential_impact_ar,
          category, stage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      const results = [];
      for (const item of breakthroughs) {
        const result = await client.query(insertQuery, [
          item.title_en,
          item.title_ar,
          item.company,
          item.symbol,
          item.description_en,
          item.description_ar,
          item.potential_impact_en,
          item.potential_impact_ar,
          item.category,
          item.stage,
        ]);
        results.push(result.rows[0]);
      }

      await client.query("COMMIT");

      // One notification per user for the whole batch, after COMMIT and
      // fire-and-forget. A user watching three of the affected symbols hears
      // once; where their matches span several items there is no single item to
      // open, so the tap goes to the stock page instead.
      const idBySymbol = new Map<string, number>();
      for (const row of results) {
        const symbol = normalizeSymbol(row.symbol);
        if (!idBySymbol.has(symbol)) idBySymbol.set(symbol, row.id);
      }

      void notifyWatchers({
        symbols: [...idBySymbol.keys()],
        type: "watchlist_breakthrough",
        title: { en: "New breakthroughs", ar: "ابتكارات جديدة" },
        body: (symbols) => ({
          en: `New breakthroughs for ${formatSymbolList(symbols, "en")}`,
          ar: `ابتكارات جديدة لأسهم ${formatSymbolList(symbols, "ar")}`,
        }),
        data: (symbols) => {
          const ids = [
            ...new Set(
              symbols.map((s) => idBySymbol.get(s)).filter((id): id is number => id !== undefined)
            ),
          ];
          return ids.length === 1
            ? { screen: "breakthrough", id: ids[0] }
            : { screen: "stock", symbol: symbols[0] };
        },
      }).catch(logAlertFailure(`breakthroughs bulk (${results.length} rows)`));

      return NextResponse.json(results, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding breakthroughs. error: " + error },
      { status: 500 }
    );
  }
}
