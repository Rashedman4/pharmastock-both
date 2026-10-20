import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/mobile/paginate";
import { normalizeSymbol } from "@/modules/stocks/stocks.service";

/**
 * GET /api/announcements?symbol=&page=&limit=
 *
 * Public list. Titles only — the Markdown body comes from the detail route.
 */
export async function GET(req: NextRequest) {
  try {
    const { page, limit, offset } = parsePaginationParams(req);
    const rawSymbol = new URL(req.url).searchParams.get("symbol");
    const symbol = rawSymbol ? normalizeSymbol(rawSymbol) : null;

    const where = symbol ? "WHERE symbol = $1" : "";
    const params = symbol ? [symbol] : [];

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM company_announcements ${where}`,
        params
      ),
      pool.query(
        `SELECT id, symbol, title_en, title_ar, source_url, announced_at, published_date
         FROM company_announcements ${where}
         ORDER BY published_date DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(countResult.rows[0].total, page, limit),
    });
  } catch (error) {
    console.error("[announcements] GET error", error);
    return NextResponse.json(
      { error: "Error fetching announcements" },
      { status: 500 }
    );
  }
}
