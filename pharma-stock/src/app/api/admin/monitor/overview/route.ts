import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Headline numbers for /admin/monitor: user counts, login activity, and the
 * size of the page-view log.
 *
 * Deliberately no subscription/revenue metrics — Stripe subscriptions are
 * switched off (see PROJECT_CONTEXT.md §1).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    // One round trip each, issued together. Every count below is a filter on
    // an indexed column (users.created_at / users.last_login_at /
    // auth_log.created_at / path_log.visited_at).
    const [users, providers, logins, latest, logs] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int                                                          AS total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int   AS new_7d,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int  AS new_30d,
          COUNT(*) FILTER (WHERE role = 'admin')::int                            AS admins,
          COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days')::int  AS active_7d,
          COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days')::int AS active_30d,
          COUNT(*) FILTER (WHERE last_login_at IS NULL)::int                     AS never_logged_in
        FROM users
      `),

      // Signup method breakdown. `provider` is null for email/password accounts.
      pool.query(`
        SELECT COALESCE(provider, 'email') AS provider, COUNT(*)::int AS count
        FROM users
        GROUP BY 1
        ORDER BY 2 DESC
      `),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE success AND created_at >= NOW() - INTERVAL '24 hours')::int AS ok_24h,
          COUNT(*) FILTER (WHERE success AND created_at >= NOW() - INTERVAL '7 days')::int   AS ok_7d,
          COUNT(*) FILTER (WHERE NOT success AND created_at >= NOW() - INTERVAL '24 hours')::int AS failed_24h,
          COUNT(DISTINCT user_id) FILTER (WHERE success AND created_at >= NOW() - INTERVAL '24 hours')::int AS unique_24h
        FROM auth_log
      `),

      pool.query(`
        SELECT
          a.id,
          a.user_id,
          COALESCE(u.email, a.email_attempted) AS email,
          TRIM(CONCAT_WS(' ', u.firstname, u.lastname)) AS name,
          a.client,
          a.method,
          a.success,
          a.failure_reason,
          a.ip,
          a.user_agent,
          a.created_at
        FROM auth_log a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 25
      `),

      pool.query(`
        SELECT
          COUNT(*)::int                                                              AS total,
          COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '24 hours')::int     AS last_24h,
          MIN(visited_at)                                                            AS oldest,
          MAX(visited_at)                                                            AS newest,
          COUNT(*) FILTER (WHERE visited_at < NOW() - INTERVAL '90 days')::int       AS older_than_90d
        FROM path_log
      `),
    ]);

    return NextResponse.json({
      users: users.rows[0],
      providers: providers.rows,
      logins: logins.rows[0],
      latestLogins: latest.rows,
      logs: logs.rows[0],
    });
  } catch (error) {
    console.error("monitor/overview failed:", error);
    return NextResponse.json(
      {
        message:
          "Failed to load monitoring overview. If auth_log or path_log is missing, apply migrations/auth_log.sql and migrations/path_log.sql.",
      },
      { status: 500 }
    );
  }
}
