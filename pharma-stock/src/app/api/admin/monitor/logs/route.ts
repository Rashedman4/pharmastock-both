import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import { buildPaginationMeta } from "@/lib/mobile/paginate";
import {
  parseLogFilters,
  buildLogWhere,
  LOG_SELECT,
  LOG_FROM,
} from "@/lib/queries/path-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 200;

/** Filtered, paginated page-view log. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const params = request.nextUrl.searchParams;
    const filters = parseLogFilters(params);

    const rawPage = parseInt(params.get("page") ?? "1", 10);
    const rawLimit = parseInt(params.get("limit") ?? "50", 10);
    const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isNaN(rawLimit) ? 50 : rawLimit));
    const offset = (page - 1) * limit;

    const { where, params: whereParams, nextIndex } = buildLogWhere(filters);

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT ${LOG_SELECT}
         ${LOG_FROM}
         ${where}
         ORDER BY l.visited_at DESC
         LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
        [...whereParams, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total ${LOG_FROM} ${where}`,
        whereParams
      ),
    ]);

    const total = count.rows[0]?.total ?? 0;

    return NextResponse.json({
      rows: rows.rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("monitor/logs GET failed:", error);
    return NextResponse.json(
      { message: "Failed to load logs. Is migrations/path_log.sql applied?" },
      { status: 500 }
    );
  }
}

/**
 * Prunes the page-view log to reclaim database space.
 *
 * Three modes, all requiring `confirm: "DELETE"` in the body on top of the
 * UI's own confirmation step:
 *   { mode: "older_than", days: 90 }
 *   { mode: "range", from: "2026-01-01", to: "2026-02-01" }   // [from, to)
 *   { mode: "all" }
 */
const pruneSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("older_than"),
    days: z.number().int().min(1).max(3650),
    confirm: z.literal("DELETE"),
  }),
  z.object({
    mode: z.literal("range"),
    from: z.string().min(1),
    to: z.string().min(1),
    confirm: z.literal("DELETE"),
  }),
  z.object({
    mode: z.literal("all"),
    confirm: z.literal("DELETE"),
  }),
]);

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = pruneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid prune request.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    let result;

    if (input.mode === "older_than") {
      result = await pool.query(
        `DELETE FROM path_log WHERE visited_at < NOW() - ($1 || ' days')::interval`,
        [String(input.days)]
      );
    } else if (input.mode === "range") {
      if (Number.isNaN(Date.parse(input.from)) || Number.isNaN(Date.parse(input.to))) {
        return NextResponse.json({ message: "Invalid date range." }, { status: 400 });
      }
      if (Date.parse(input.from) >= Date.parse(input.to)) {
        return NextResponse.json(
          { message: "The start of the range must be before its end." },
          { status: 400 }
        );
      }
      result = await pool.query(
        `DELETE FROM path_log WHERE visited_at >= $1::timestamptz AND visited_at < $2::timestamptz`,
        [input.from, input.to]
      );
    } else {
      // TRUNCATE would be faster, but path_log has a FK to users and nothing
      // references it, so a plain DELETE is safe and stays inside normal
      // transaction/rollback semantics.
      result = await pool.query(`DELETE FROM path_log`);
    }

    const deleted = result.rowCount ?? 0;

    // DELETE leaves dead tuples behind; the disk space is only handed back to
    // the table's free space map after a vacuum. Autovacuum will get there,
    // but asking now is what makes the "free database space" button actually
    // free space in a timely way. It cannot run inside a transaction and can
    // take a while on a large table, so it is fired off without awaiting.
    if (deleted > 0) {
      void pool
        .query(`VACUUM (ANALYZE) path_log`)
        .catch((err) => console.error("path_log vacuum after prune failed:", err));
    }

    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("monitor/logs DELETE failed:", error);
    return NextResponse.json({ message: "Failed to delete logs." }, { status: 500 });
  }
}
