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

    const query = `
      INSERT INTO daily_updates (symbol, subtitle_en, subtitle_ar, description_en, description_ar, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      symbol,
      subtitle?.en || null,
      subtitle?.ar || null,
      description.en,
      description.ar,
      token.sub ? Number(token.sub) : null,
    ]);

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
    const existing = await pool.query(
      "SELECT * FROM daily_updates WHERE id = $1",
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        { error: "Daily update not found" },
        { status: 404 }
      );
    }

    await pool.query("DELETE FROM daily_updates WHERE id = $1", [id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting daily update. Error: " + error },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rawLimit = parseInt(url.searchParams.get("limit") ?? "500", 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 2000) : 500;
    const rawPage = parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const offset = (page - 1) * limit;

    // Default limit (500) is intentionally generous so a call with no query
    // params returns effectively the same full result set admins see today
    // at current data volumes, while still capping the unbounded worst case.
    const query = `SELECT * FROM daily_updates ORDER BY published_date DESC LIMIT $1 OFFSET $2`;
    const result = await pool.query(query, [limit, offset]);

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

    const query = `
      UPDATE daily_updates
      SET symbol = $1, subtitle_en = $2, subtitle_ar = $3, description_en = $4, description_ar = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const result = await pool.query(query, [
      symbol,
      subtitle_en || null,
      subtitle_ar || null,
      description_en,
      description_ar,
      id,
    ]);

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
