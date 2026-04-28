import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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
    const body = await req.json();
    const {
      title_en,
      title_ar,
      company,
      symbol,
      description_en,
      description_ar,
      potential_impact_en,
      potential_impact_ar,
      category,
      stage,
    } = body;

    const client = await pool.connect();
    const query = `
      INSERT INTO breakthroughs (
        title_en, title_ar, company, symbol,
        description_en, description_ar,
        potential_impact_en, potential_impact_ar,
        category, stage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const result = await client.query(query, [
      title_en,
      title_ar,
      company,
      symbol,
      description_en,
      description_ar,
      potential_impact_en,
      potential_impact_ar,
      category,
      stage,
    ]);
    client.release();

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding breakthrough. error: " + error },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const body = await req.json();
    const { id } = body;
    const client = await pool.connect();
    const breakthroughResult = await client.query(
      "SELECT * FROM breakthroughs WHERE id = $1",
      [id]
    );

    if (breakthroughResult.rowCount === 0) {
      client.release();
      return NextResponse.json(
        { error: "Breakthrough not found" },
        { status: 404 }
      );
    }

    await client.query("DELETE FROM breakthroughs WHERE id = $1", [id]);
    client.release();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting breakthrough. Error: " + error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await pool.connect();
    const query = `SELECT * FROM breakthroughs ORDER BY created_at DESC`;
    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching breakthroughs, error: " + error },
      { status: 500 }
    );
  }
}
