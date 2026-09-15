import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/mobile/paginate';
import { APP_TIMEZONE, parseDateParam, todayInAppTimezone } from '@/lib/mobile/day-window';

/**
 * GET /api/mobile/v1/daily-updates?date=YYYY-MM-DD&page=&limit=
 *
 * Returns one calendar day of updates, defaulting to today. `date` is bounded
 * in APP_TIMEZONE (see lib/mobile/day-window.ts) rather than UTC, so the day
 * the reader picks is the same day the admin published on.
 *
 * This replaces the previous rolling `NOW() - INTERVAL '24 hours'` window,
 * which made older days unreachable. The web app is unaffected: it has its own
 * route at /api/daily-updates with a different response shape and keeps its 24h
 * behavior. No other client consumes this endpoint.
 *
 * The response shape (`{ data, pagination }`) is unchanged.
 */
export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  const rawDate = new URL(req.url).searchParams.get('date');
  // Absent means "today"; present-but-malformed is an error, never a silent
  // fallback, so a client bug surfaces instead of quietly showing the wrong day.
  const date = rawDate === null ? todayInAppTimezone() : parseDateParam(rawDate);
  if (date === null) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_DATE',
          message: 'Query param `date` must be a valid calendar date in YYYY-MM-DD format',
        },
      },
      { status: 400 }
    );
  }

  try {
    const { page, limit, offset } = parsePaginationParams(req);

    // [startOfDay, nextDay) in APP_TIMEZONE. `timestamp AT TIME ZONE <zone>`
    // reads the naive timestamp as a wall-clock time in that zone and yields a
    // timestamptz, which is what published_date compares against. The
    // half-open range keeps midnight from landing in two days at once.
    const dayWindow = `
      published_date >= ($1::date)::timestamp AT TIME ZONE $2
      AND published_date < (($1::date) + 1)::timestamp AT TIME ZONE $2
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total FROM daily_updates WHERE ${dayWindow}`,
        [date, APP_TIMEZONE]
      ),
      pool.query(
        `SELECT id, symbol, subtitle_en, subtitle_ar, description_en, description_ar, published_date
         FROM daily_updates
         WHERE ${dayWindow}
         ORDER BY published_date DESC
         LIMIT $3 OFFSET $4`,
        [date, APP_TIMEZONE, limit, offset]
      ),
    ]);

    const total: number = countResult.rows[0].total;

    return NextResponse.json(
      { data: dataResult.rows, pagination: buildPaginationMeta(total, page, limit) },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    );
  } catch (err) {
    console.error('[daily-updates] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch daily updates' } },
      { status: 500 }
    );
  }
}
