import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/mobile/paginate";
import { ensureStocks, normalizeSymbol } from "@/modules/stocks/stocks.service";
import {
  announcementIssues,
  announcementSchema,
  announcementUpdateSchema,
} from "@/modules/stocks/announcement.schema";
import {
  formatSymbolList,
  logAlertFailure,
  notifyWatchers,
} from "@/lib/services/content-alert.service";

/**
 * Company announcements: bilingual Markdown, one per request.
 *
 * Publishing notifies the users watching that symbol with alerts on (one
 * notification each), fire-and-forget after COMMIT — see PROJECT_CONTEXT §7.
 * Pass `"notify": false` to publish silently.
 */

function invalid(error: z.ZodError) {
  return NextResponse.json(
    { error: "Invalid input", issues: announcementIssues(error) },
    { status: 400 }
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, offset } = parsePaginationParams(req);
    const symbol = (new URL(req.url).searchParams.get("symbol") ?? "").trim();
    const where = symbol ? "WHERE symbol = $1" : "";
    const params = symbol ? [normalizeSymbol(symbol)] : [];

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM company_announcements ${where}`,
        params
      ),
      pool.query(
        `SELECT id, symbol, title_en, title_ar, content_en, content_ar,
                source_url, announced_at, published_date, created_at, updated_at
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
    console.error("[admin/announcements] GET error", error);
    return NextResponse.json(
      { error: "Error fetching announcements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (Array.isArray(body)) {
    return NextResponse.json(
      {
        error:
          "Announcements are published one at a time. Paste a single JSON object, not an array.",
      },
      { status: 400 }
    );
  }

  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  const { symbol, title, content, source_url, announced_at, notify } = parsed.data;
  const upperSymbol = normalizeSymbol(symbol);

  const client = await pool.connect();
  let created: { id: number } | null = null;

  try {
    await client.query("BEGIN");
    await ensureStocks(client, [{ symbol: upperSymbol }]);

    const { rows } = await client.query(
      `INSERT INTO company_announcements
         (symbol, title_en, title_ar, content_en, content_ar,
          source_url, announced_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, symbol, title_en, title_ar, content_en, content_ar,
                 source_url, announced_at, published_date`,
      [
        upperSymbol,
        title.en,
        title.ar,
        content.en,
        content.ar,
        source_url || null,
        announced_at || null,
        auth.userId,
      ]
    );

    await client.query("COMMIT");
    created = rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[admin/announcements] POST error", error);
    return NextResponse.json(
      { error: "Error adding announcement" },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  // After COMMIT, fire-and-forget: a push failure must never fail the publish.
  if (notify !== false && created) {
    const announcementId = created.id;
    void notifyWatchers({
      symbols: [upperSymbol],
      type: "announcement",
      title: { en: "New company announcement", ar: "إعلان جديد من الشركة" },
      body: (symbols) => ({
        en: `${formatSymbolList(symbols, "en")}: ${title.en}`,
        ar: `${formatSymbolList(symbols, "ar")}: ${title.ar}`,
      }),
      data: { screen: "announcement", id: announcementId },
    }).catch(logAlertFailure(`announcement ${announcementId}`));
  }

  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = announcementUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);

  const { id, symbol, title, content, source_url, announced_at } = parsed.data;
  const upperSymbol = normalizeSymbol(symbol);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensureStocks(client, [{ symbol: upperSymbol }]);

    const { rows } = await client.query(
      `UPDATE company_announcements
       SET symbol = $2, title_en = $3, title_ar = $4, content_en = $5,
           content_ar = $6, source_url = $7, announced_at = $8, updated_at = NOW()
       WHERE id = $1
       RETURNING id, symbol, title_en, title_ar, content_en, content_ar,
                 source_url, announced_at, published_date`,
      [
        id,
        upperSymbol,
        title.en,
        title.ar,
        content.en,
        content.ar,
        source_url || null,
        announced_at || null,
      ]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    await client.query("COMMIT");
    // Editing never re-notifies: subscribers already heard about this one.
    return NextResponse.json(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[admin/announcements] PUT error", error);
    return NextResponse.json(
      { error: "Error updating announcement" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = z
    .object({ id: z.number().int().positive() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const result = await pool.query(
      "DELETE FROM company_announcements WHERE id = $1",
      [parsed.data.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/announcements] DELETE error", error);
    return NextResponse.json(
      { error: "Error deleting announcement" },
      { status: 500 }
    );
  }
}
