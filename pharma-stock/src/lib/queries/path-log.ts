/**
 * Shared filter/SQL builder for the `path_log` page-view table, used by every
 * /api/admin/monitor/logs endpoint (list, CSV export, prune) so the rows you
 * see in the table are exactly the rows the export writes and the delete
 * removes.
 *
 * See migrations/path_log.sql for the table and its indexes.
 */

export interface LogFilters {
  /** Substring match against `path`, or an exact match against `ip`. */
  q: string | null;
  /** "all" | "members" (user_id not null) | "guests" (user_id null) | a user id */
  audience: "all" | "members" | "guests";
  userId: number | null;
  country: string | null;
  /** Inclusive lower bound, ISO date or datetime. */
  from: string | null;
  /** Exclusive upper bound, ISO date or datetime. */
  to: string | null;
}

export const EMPTY_FILTERS: LogFilters = {
  q: null,
  audience: "all",
  userId: null,
  country: null,
  from: null,
  to: null,
};

function clean(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/** Rejects anything that isn't a date Postgres will accept, so a bad query string can't 500. */
function cleanDate(value: string | null): string | null {
  const v = clean(value);
  if (!v) return null;
  return Number.isNaN(Date.parse(v)) ? null : v;
}

export function parseLogFilters(params: URLSearchParams): LogFilters {
  const rawAudience = params.get("audience");
  const audience: LogFilters["audience"] =
    rawAudience === "members" || rawAudience === "guests" ? rawAudience : "all";

  const rawUserId = params.get("userId");
  const parsedUserId = rawUserId ? Number(rawUserId) : NaN;

  return {
    q: clean(params.get("q")),
    audience,
    userId: Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null,
    country: clean(params.get("country")),
    from: cleanDate(params.get("from")),
    to: cleanDate(params.get("to")),
  };
}

/**
 * Builds the WHERE clause and its parameters. `startIndex` is the first
 * placeholder number to use, so callers can prepend their own parameters.
 */
export function buildLogWhere(
  filters: LogFilters,
  startIndex = 1
): { where: string; params: unknown[]; nextIndex: number } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = startIndex;

  if (filters.q) {
    // `path` uses a prefix-friendly ILIKE; `ip` is compared exactly so that
    // pasting an address in the search box finds that visitor's rows.
    clauses.push(`(l.path ILIKE $${i} OR l.ip = $${i + 1})`);
    params.push(`%${filters.q}%`, filters.q);
    i += 2;
  }

  if (filters.userId !== null) {
    clauses.push(`l.user_id = $${i}`);
    params.push(filters.userId);
    i += 1;
  } else if (filters.audience === "members") {
    clauses.push(`l.user_id IS NOT NULL`);
  } else if (filters.audience === "guests") {
    clauses.push(`l.user_id IS NULL`);
  }

  if (filters.country) {
    clauses.push(`l.country = $${i}`);
    params.push(filters.country);
    i += 1;
  }

  if (filters.from) {
    // Explicit ::timestamptz rather than relying on the driver to infer the
    // parameter type from context — `timestamptz >= text` has no operator.
    clauses.push(`l.visited_at >= $${i}::timestamptz`);
    params.push(filters.from);
    i += 1;
  }

  if (filters.to) {
    clauses.push(`l.visited_at < $${i}::timestamptz`);
    params.push(filters.to);
    i += 1;
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
    nextIndex: i,
  };
}

/** Column list shared by the table and the CSV export, in the same order. */
export const LOG_SELECT = `
  l.id,
  l.path,
  l.user_id,
  u.email,
  l.visited_at,
  l.country,
  l.region,
  l.ip,
  l.user_agent
`;

export const LOG_FROM = `FROM path_log l LEFT JOIN users u ON u.id = l.user_id`;

export interface LogRow {
  id: number;
  path: string;
  user_id: number | null;
  email: string | null;
  visited_at: string;
  country: string | null;
  region: string | null;
  ip: string | null;
  user_agent: string | null;
}
