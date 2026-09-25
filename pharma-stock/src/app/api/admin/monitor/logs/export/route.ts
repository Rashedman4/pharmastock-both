import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";
import {
  parseLogFilters,
  buildLogWhere,
  LOG_SELECT,
  LOG_FROM,
  type LogRow,
} from "@/lib/queries/path-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CSV export of the page-view log, honouring the same filters as the table.
 *
 * The table is large (~63k rows and growing) and an unfiltered export of it
 * must not be built up in memory as one string. Rows are fetched in keyset
 * batches and pushed into a ReadableStream, so peak memory is one batch
 * regardless of how many rows match.
 *
 * Keyset (`id < lastId`) rather than OFFSET: the offset of the last page of a
 * 60k-row export costs a full scan to skip past, and new rows arriving mid-
 * export would shift the window and duplicate or drop rows.
 */
const BATCH_SIZE = 2000;

const HEADER = [
  "id",
  "path",
  "user_id",
  "email",
  "visited_at",
  "country",
  "region",
  "ip",
  "user_agent",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  // Always quote: paths, user agents and emails can all contain commas, and a
  // leading =/+/-/@ would otherwise be read as a formula by Excel.
  return `"${s.replace(/"/g, '""')}"`;
}

function csvRow(row: LogRow): string {
  return (
    [
      row.id,
      row.path,
      row.user_id,
      row.email,
      row.visited_at,
      row.country,
      row.region,
      row.ip,
      row.user_agent,
    ]
      .map(csvCell)
      .join(",") + "\r\n"
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const filters = parseLogFilters(request.nextUrl.searchParams);
  const { where, params, nextIndex } = buildLogWhere(filters);

  // The keyset cursor becomes one more parameter appended to the filters.
  const cursorPlaceholder = `$${nextIndex}`;
  const limitPlaceholder = `$${nextIndex + 1}`;
  const sql = `
    SELECT ${LOG_SELECT}
    ${LOG_FROM}
    ${where ? `${where} AND` : "WHERE"} l.id < ${cursorPlaceholder}
    ORDER BY l.id DESC
    LIMIT ${limitPlaceholder}
  `;

  const encoder = new TextEncoder();
  let cursor = Number.MAX_SAFE_INTEGER;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // BOM so Excel opens Arabic paths and user agents as UTF-8.
      controller.enqueue(encoder.encode("﻿"));
      controller.enqueue(encoder.encode(HEADER.join(",") + "\r\n"));
    },
    async pull(controller) {
      try {
        const { rows } = await pool.query<LogRow>(sql, [...params, cursor, BATCH_SIZE]);

        if (rows.length === 0) {
          controller.close();
          return;
        }

        let chunk = "";
        for (const row of rows) chunk += csvRow(row);
        controller.enqueue(encoder.encode(chunk));

        cursor = rows[rows.length - 1].id;
        if (rows.length < BATCH_SIZE) controller.close();
      } catch (error) {
        console.error("monitor/logs/export failed:", error);
        // The response headers are already sent by this point, so the only way
        // to signal failure is to abort the download.
        controller.error(error);
      }
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="path-log-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
