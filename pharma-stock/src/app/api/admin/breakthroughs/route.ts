import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/modules/program/route-helpers";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

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
    const result = await pool.query(query, [
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

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding breakthrough. error: " + error },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { id } = body;
    const breakthroughResult = await pool.query(
      "SELECT * FROM breakthroughs WHERE id = $1",
      [id]
    );

    if (breakthroughResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Breakthrough not found" },
        { status: 404 }
      );
    }

    await pool.query("DELETE FROM breakthroughs WHERE id = $1", [id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting breakthrough. Error: " + error },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

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
    const query = `SELECT * FROM breakthroughs ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const result = await pool.query(query, [limit, offset]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching breakthroughs, error: " + error },
      { status: 500 }
    );
  }
}
