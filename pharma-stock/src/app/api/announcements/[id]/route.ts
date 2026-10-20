import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/** GET /api/announcements/[id] — public, full bilingual Markdown. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: "Announcement id must be a positive integer" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT ca.id, ca.symbol, ca.title_en, ca.title_ar, ca.content_en, ca.content_ar,
              ca.source_url, ca.announced_at, ca.published_date,
              s.name_en AS stock_name_en, s.name_ar AS stock_name_ar
       FROM company_announcements ca
       LEFT JOIN stocks s ON s.symbol = ca.symbol
       WHERE ca.id = $1`,
      [numericId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("[announcements/:id] GET error", error);
    return NextResponse.json(
      { error: "Error fetching announcement" },
      { status: 500 }
    );
  }
}
