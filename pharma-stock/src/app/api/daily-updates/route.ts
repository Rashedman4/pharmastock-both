import { NextResponse } from "next/server";
import pool from "@/lib/db";

const UPDATES_PER_PAGE = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const symbol = (searchParams.get("symbol") || "").trim();
  const offset = (page - 1) * UPDATES_PER_PAGE;

  try {
    const client = await pool.connect();

    // Get total count with optional partial symbol filter, limited to the last 24 hours
    let totalUpdates = 0;
    if (symbol) {
      const like = `%${symbol}%`;
      const countFiltered = await client.query(
        "SELECT COUNT(*) FROM daily_updates WHERE symbol ILIKE $1 AND published_date >= NOW() - INTERVAL '24 hours'",
        [like]
      );
      totalUpdates = parseInt(countFiltered.rows[0].count);
    } else {
      const countResult = await client.query(
        "SELECT COUNT(*) FROM daily_updates WHERE published_date >= NOW() - INTERVAL '24 hours'"
      );
      totalUpdates = parseInt(countResult.rows[0].count);
    }
    const totalPages = Math.ceil(totalUpdates / UPDATES_PER_PAGE);

    // Get paginated daily updates with optional partial symbol filter, limited to the last 24 hours
    let result;
    if (symbol) {
      const like = `%${symbol}%`;
      const query = `
        SELECT *
        FROM daily_updates
        WHERE symbol ILIKE $1 AND published_date >= NOW() - INTERVAL '24 hours'
        ORDER BY published_date DESC
        LIMIT $2 OFFSET $3
      `;
      result = await client.query(query, [like, UPDATES_PER_PAGE, offset]);
    } else {
      const query = `
        SELECT *
        FROM daily_updates
        WHERE published_date >= NOW() - INTERVAL '24 hours'
        ORDER BY published_date DESC
        LIMIT $1 OFFSET $2
      `;
      result = await client.query(query, [UPDATES_PER_PAGE, offset]);
    }
    client.release();

    return NextResponse.json(
      {
        dailyUpdates: result.rows,
        totalPages,
        currentPage: page,
        totalUpdates,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching daily updates, error: " + error },
      { status: 500 }
    );
  }
}
