import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import {
  APP_TIMEZONE,
  MAX_AVAILABLE_DATE_RANGE_DAYS,
  addDays,
  daysBetween,
  parseDateParam,
  todayInAppTimezone,
} from '@/lib/mobile/day-window';

/**
 * GET /api/mobile/v1/daily-updates/available-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * -> { data: [{ date: 'YYYY-MM-DD', count: number }] }
 *
 * Lets the day picker mark or disable days that have nothing to show, so the
 * user doesn't have to tap into an empty day to find that out. Days with no
 * rows are simply absent from the response rather than returned with count 0.
 *
 * Both bounds default to a MAX_AVAILABLE_DATE_RANGE_DAYS window ending today,
 * and the span is capped server-side so a client can't request an unbounded
 * group-by. Days are bucketed in APP_TIMEZONE, matching the list endpoint.
 */
export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  const params = new URL(req.url).searchParams;
  const rawFrom = params.get('from');
  const rawTo = params.get('to');

  const today = todayInAppTimezone();
  const to = rawTo === null ? today : parseDateParam(rawTo);
  const from =
    rawFrom === null
      ? addDays(to ?? today, -(MAX_AVAILABLE_DATE_RANGE_DAYS - 1))
      : parseDateParam(rawFrom);

  if (from === null || to === null) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_DATE',
          message: 'Query params `from` and `to` must be valid calendar dates in YYYY-MM-DD format',
        },
      },
      { status: 400 }
    );
  }

  const span = daysBetween(from, to);
  if (span < 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_RANGE', message: '`from` must not be after `to`' } },
      { status: 400 }
    );
  }
  if (span + 1 > MAX_AVAILABLE_DATE_RANGE_DAYS) {
    return NextResponse.json(
      {
        error: {
          code: 'RANGE_TOO_LARGE',
          message: `Range must not exceed ${MAX_AVAILABLE_DATE_RANGE_DAYS} days`,
        },
      },
      { status: 400 }
    );
  }

  try {
    // The WHERE clause is a plain range over published_date, so it uses the
    // existing idx_daily_updates_published_date index; only the already-narrowed
    // rows are then bucketed by local day, which keeps the expression out of the
    // scan predicate.
    const { rows } = await pool.query(
      `SELECT to_char(published_date AT TIME ZONE $3, 'YYYY-MM-DD') AS date,
              COUNT(*)::int AS count
         FROM daily_updates
        WHERE published_date >= ($1::date)::timestamp AT TIME ZONE $3
          AND published_date < (($2::date) + 1)::timestamp AT TIME ZONE $3
        GROUP BY 1
        ORDER BY 1 DESC`,
      [from, to, APP_TIMEZONE]
    );

    return NextResponse.json(
      { data: rows },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[daily-updates/available-dates] GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch available dates' } },
      { status: 500 }
    );
  }
}
