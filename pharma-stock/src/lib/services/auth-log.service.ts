import type { NextRequest } from "next/server";
import pool from "@/lib/db";
import { getClientIPFromHeaders } from "@/lib/rate-limit";

/**
 * Login tracking — writes one `auth_log` row per login attempt and keeps
 * `users.last_login_at` current. Backs the admin monitor page
 * (src/app/admin/monitor).
 *
 * Two rules govern everything in this file:
 *
 *   1. Logging must never break the login it is logging. Every call is
 *      fire-and-forget: `recordLogin` returns synchronously, and any error
 *      (including the table not existing yet, before migrations/auth_log.sql
 *      is applied) is swallowed after a console.error. A caller must never
 *      `await` it inside an auth path.
 *
 *   2. One round trip per login. The insert and the users update are a single
 *      statement via a data-modifying CTE, and it goes through `pool.query`
 *      rather than connect()/release(), so no pooled connection is held open
 *      across the rest of the request.
 */

export type AuthClient = "web" | "mobile";
export type AuthMethod =
  | "credentials"
  | "google"
  | "apple"
  | "handoff"
  | "refresh";

export interface LoginAttempt {
  userId?: number | string | null;
  client: AuthClient;
  method: AuthMethod;
  success: boolean;
  /** What the user typed. Kept even on failure so repeated probing is visible. */
  emailAttempted?: string | null;
  failureReason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

// `last_login_at` is only touched on a successful, attributable login, so the
// UPDATE is a no-op for failures and for attempts against unknown addresses.
const RECORD_LOGIN_SQL = `
  WITH logged AS (
    INSERT INTO auth_log
      (user_id, client, method, success, email_attempted, failure_reason, ip, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING user_id, success
  )
  UPDATE users u
     SET last_login_at = NOW()
    FROM logged l
   WHERE l.success
     AND l.user_id IS NOT NULL
     AND u.id = l.user_id
`;

function toUserId(value: LoginAttempt["userId"]): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) ? n : null;
}

/** Postgres TEXT has no length cap, but a hostile User-Agent shouldn't be one. */
function truncate(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Records a login attempt. Returns immediately — the write happens in the
 * background and its failure is never surfaced to the caller.
 */
export function recordLogin(attempt: LoginAttempt): void {
  const params = [
    toUserId(attempt.userId),
    attempt.client,
    attempt.method,
    attempt.success,
    truncate(attempt.emailAttempted, 320),
    truncate(attempt.failureReason, 200),
    truncate(attempt.ip, 64),
    truncate(attempt.userAgent, 512),
  ];

  void pool.query(RECORD_LOGIN_SQL, params).catch((err) => {
    // Swallowed deliberately — see rule 1 above.
    console.error("auth_log: failed to record login attempt", err);
  });
}

/** Pulls ip + user-agent off an App Router request. */
export function requestAuthContext(req: NextRequest): {
  ip: string;
  userAgent: string | null;
} {
  return {
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown",
    userAgent: req.headers.get("user-agent"),
  };
}

/**
 * Same, for the Pages-Router-shaped request NextAuth hands to a Credentials
 * provider's `authorize(credentials, req)`.
 */
export function headersAuthContext(
  headers: Record<string, string | string[] | undefined> | undefined
): { ip: string; userAgent: string | null } {
  const ua = headers?.["user-agent"];
  return {
    ip: getClientIPFromHeaders(headers),
    userAgent: (Array.isArray(ua) ? ua[0] : ua) ?? null,
  };
}
