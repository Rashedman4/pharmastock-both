import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authorized emails
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
          token.sub ? Number(token.sub) : null,
          publishedDate,
        ]);
        results.push(result.rows[0]);
      }

      await client.query("COMMIT");
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
