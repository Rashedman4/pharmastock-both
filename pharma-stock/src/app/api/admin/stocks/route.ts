import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/mobile/paginate";
import { normalizeSymbol } from "@/modules/stocks/stocks.service";

/**
 * The covered-stock universe. Content inserts keep this table filled
 * automatically (`ensureStocks`); this is where an admin corrects the names
 * those inserts guessed, deactivates a symbol so it stops showing up in
 * search, or adds one ahead of any content.
 */

const symbolSchema = z
  .string()
  .trim()
  .min(1, "Symbol is required")
  .max(20, "Symbol must be 20 characters or fewer")
  .regex(/^[A-Za-z0-9.\-]+$/, "Symbol may only contain letters, digits, '.' and '-'");

const createSchema = z.object({
  symbol: symbolSchema,
  name_en: z.string().trim().min(1, "English name is required"),
  name_ar: z.string().trim().nullish(),
  is_active: z.boolean().optional(),
});

const updateSchema = z.object({
  symbol: symbolSchema,
  name_en: z.string().trim().min(1, "English name is required"),
  name_ar: z.string().trim().nullish(),
  is_active: z.boolean(),
});

function invalid(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid input",
      issues: error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    },
    { status: 400 }
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, offset } = parsePaginationParams(req);
    const search = (new URL(req.url).searchParams.get("search") ?? "").trim();

    // Escape the LIKE wildcards so a search for "%" is a literal search.
    const like = search ? `%${search.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const where = like
      ? `WHERE lower(symbol) LIKE $1 ESCAPE '\\' OR lower(name_en) LIKE $1 ESCAPE '\\' OR lower(COALESCE(name_ar, '')) LIKE $1 ESCAPE '\\'`
      : "";
    const params = like ? [like] : [];

    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM stocks ${where}`, params),
      pool.query(
        `SELECT symbol, name_en, name_ar, is_active, created_at, updated_at
         FROM stocks ${where}
         ORDER BY symbol
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: buildPaginationMeta(countResult.rows[0].total, page, limit),
    });
  } catch (error) {
    console.error("[admin/stocks] GET error", error);
    return NextResponse.json({ error: "Error fetching stocks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const { rows } = await pool.query(
      `INSERT INTO stocks (symbol, name_en, name_ar, is_active)
       VALUES ($1, $2, $3, COALESCE($4, TRUE))
       ON CONFLICT (symbol) DO NOTHING
       RETURNING symbol, name_en, name_ar, is_active, created_at, updated_at`,
      [
        normalizeSymbol(parsed.data.symbol),
        parsed.data.name_en,
        parsed.data.name_ar || null,
        parsed.data.is_active ?? null,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "That symbol is already in the universe. Edit it instead." },
        { status: 409 }
      );
    }

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("[admin/stocks] POST error", error);
    return NextResponse.json({ error: "Error adding stock" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const { rows } = await pool.query(
      `UPDATE stocks
       SET name_en = $2, name_ar = $3, is_active = $4, updated_at = NOW()
       WHERE symbol = $1
       RETURNING symbol, name_en, name_ar, is_active, created_at, updated_at`,
      [
        normalizeSymbol(parsed.data.symbol),
        parsed.data.name_en,
        parsed.data.name_ar || null,
        parsed.data.is_active,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("[admin/stocks] PUT error", error);
    return NextResponse.json({ error: "Error updating stock" }, { status: 500 });
  }
}
