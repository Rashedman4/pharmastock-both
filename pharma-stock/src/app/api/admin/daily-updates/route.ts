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
    const { symbol, subtitle, description } = body;

    const client = await pool.connect();
    const query = `
      INSERT INTO daily_updates (symbol, subtitle_en, subtitle_ar, description_en, description_ar, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await client.query(query, [
      symbol,
      subtitle?.en || null,
      subtitle?.ar || null,
      description.en,
      description.ar,
      token.sub ? Number(token.sub) : null,
    ]);
    client.release();

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding daily update. error: " + error },
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
    const existing = await client.query(
      "SELECT * FROM daily_updates WHERE id = $1",
      [id]
    );

    if (existing.rowCount === 0) {
      client.release();
      return NextResponse.json(
        { error: "Daily update not found" },
        { status: 404 }
      );
    }

    await client.query("DELETE FROM daily_updates WHERE id = $1", [id]);
    client.release();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting daily update. Error: " + error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await pool.connect();
    const query = `SELECT * FROM daily_updates ORDER BY published_date DESC`;
    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching daily updates, error: " + error },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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
    const { id, symbol, subtitle_en, subtitle_ar, description_en, description_ar } = body;

    const client = await pool.connect();
    const query = `
      UPDATE daily_updates
      SET symbol = $1, subtitle_en = $2, subtitle_ar = $3, description_en = $4, description_ar = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const result = await client.query(query, [
      symbol,
      subtitle_en || null,
      subtitle_ar || null,
      description_en,
      description_ar,
      id,
    ]);
    client.release();

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Daily update not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating daily update. error: " + error },
      { status: 500 }
    );
  }
}
