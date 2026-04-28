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
