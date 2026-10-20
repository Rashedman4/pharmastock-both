import type { Pool, PoolClient } from "pg";
import pool from "@/lib/db";

/**
 * The covered-stock universe and per-user watchlists.
 *
 * Every stock-facing route (web and mobile) goes through this module so the
 * SQL lives in one place. Raw parameterized SQL only — no ORM, per
 * PROJECT_CONTEXT §7.
 */

/** Anything that can run a query: the pool, or a client inside a transaction. */
type Queryable = Pick<Pool | PoolClient, "query">;

export const WATCHLIST_MAX_SYMBOLS = 50;

/** Longest search term we bother sending to the database. */
const MAX_QUERY_LENGTH = 40;

export interface StockRow {
  symbol: string;
  name_en: string;
  name_ar: string | null;
}

export interface CachedPrice {
  current_price: string | null;
  previous_close_price: string | null;
  change_amount: string | null;
  change_percent: string | null;
  currency: string | null;
  market_status: string | null;
  fetched_at: string | null;
}

export interface StockDetail extends StockRow {
  is_active: boolean;
  /** Null when the symbol has never been priced — we never call FMP here. */
  price: CachedPrice | null;
  is_watched: boolean;
  alerts_enabled: boolean;
  announcements: AnnouncementSummary[];
  daily_updates: DailyUpdateSummary[];
  breakthroughs: BreakthroughSummary[];
  news: NewsSummary[];
}

export interface AnnouncementSummary {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  source_url: string | null;
  announced_at: string | null;
  published_date: string;
}

export interface DailyUpdateSummary {
  id: number;
  symbol: string;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  published_date: string;
}

export interface BreakthroughSummary {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  category: string;
  stage: string;
  created_at: string;
}

export interface NewsSummary {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  price: string | null;
  published_date: string;
}

export interface WatchlistEntry extends StockRow {
  alerts_enabled: boolean;
  created_at: string;
  price: CachedPrice | null;
}

export type WatchlistAddResult =
  | { status: "added" }
  | { status: "already_watched" }
  | { status: "limit_reached"; limit: number }
  | { status: "unknown_symbol" };

/** Normalizes a symbol the way the `stocks` table stores it. */
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/**
 * Inserts any symbols we have not seen before.
 *
 * Called from inside each admin content insert (news, breakthroughs, daily
 * updates, announcements) so the universe stays complete without anybody
 * curating it. A single INSERT … ON CONFLICT DO NOTHING: it never overwrites a
 * name an admin has corrected in /admin/stocks.
 *
 * Pass the transaction's client so it commits or rolls back with the content.
 */
export async function ensureStocks(
  db: Queryable,
  entries: Array<{ symbol: string | null | undefined; name?: string | null }>
): Promise<void> {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const symbol = normalizeSymbol(entry.symbol ?? "");
    if (!symbol) continue;
    const name = entry.name?.trim();
    // First non-empty name wins; the symbol itself is the fallback.
    if (!seen.has(symbol) || (name && seen.get(symbol) === symbol)) {
      seen.set(symbol, name || symbol);
    }
  }
  if (seen.size === 0) return;

  const symbols = [...seen.keys()];
  const names = symbols.map((s) => seen.get(s) as string);

  await db.query(
    `INSERT INTO stocks (symbol, name_en)
     SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT (symbol) DO NOTHING`,
    [symbols, names]
  );
}

/** Escapes the LIKE wildcards so a user typing "%" searches for a literal "%". */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Ranked search over the active universe.
 *
 * Rank order: exact symbol, symbol prefix, name prefix (EN or AR), then
 * anything containing the term.
 */
export async function searchStocks(
  q: string,
  limit = 20
): Promise<StockRow[]> {
  const term = q.trim().slice(0, MAX_QUERY_LENGTH).toLowerCase();
  if (!term) return [];

  const escaped = escapeLike(term);
  const prefix = `${escaped}%`;
  const contains = `%${escaped}%`;
  const safeLimit = Math.min(50, Math.max(1, limit));

  const { rows } = await pool.query(
    `SELECT symbol, name_en, name_ar
     FROM stocks
     WHERE is_active
       AND (
         lower(symbol) LIKE $3 ESCAPE '\\'
         OR lower(name_en) LIKE $3 ESCAPE '\\'
         OR lower(COALESCE(name_ar, '')) LIKE $3 ESCAPE '\\'
       )
     ORDER BY
       CASE
         WHEN lower(symbol) = $1 THEN 0
         WHEN lower(symbol) LIKE $2 ESCAPE '\\' THEN 1
         WHEN lower(name_en) LIKE $2 ESCAPE '\\'
           OR lower(COALESCE(name_ar, '')) LIKE $2 ESCAPE '\\' THEN 2
         ELSE 3
       END,
       symbol
     LIMIT $4`,
    [term, prefix, contains, safeLimit]
  );

  return rows as StockRow[];
}

/**
 * One stock with its cached price, the caller's watch state and the latest 5
 * items of each content type for that symbol — in a single round trip.
 *
 * The price comes from `price_cache_simple` only: a user request never reaches
 * the market-data provider, so an unpriced symbol just renders "—".
 *
 * Pass `userId = null` for guests; the watch columns then come back false.
 */
export async function getStockDetail(
  symbol: string,
  userId: number | null
): Promise<StockDetail | null> {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  const { rows } = await pool.query(
    `SELECT
       s.symbol, s.name_en, s.name_ar, s.is_active,
       p.current_price, p.previous_close_price, p.change_amount,
       p.change_percent, p.currency, p.market_status, p.fetched_at,
       (w.user_id IS NOT NULL) AS is_watched,
       COALESCE(w.alerts_enabled, FALSE) AS alerts_enabled,
       (
         SELECT COALESCE(json_agg(a), '[]'::json) FROM (
           SELECT id, symbol, title_en, title_ar, source_url, announced_at, published_date
           FROM company_announcements
           WHERE symbol = s.symbol
           ORDER BY published_date DESC
           LIMIT 5
         ) a
       ) AS announcements,
       (
         SELECT COALESCE(json_agg(d), '[]'::json) FROM (
           SELECT id, symbol, subtitle_en, subtitle_ar, published_date
           FROM daily_updates
           WHERE upper(symbol::text) = s.symbol
           ORDER BY published_date DESC
           LIMIT 5
         ) d
       ) AS daily_updates,
       (
         SELECT COALESCE(json_agg(b), '[]'::json) FROM (
           SELECT id, symbol, title_en, title_ar, category, stage, created_at
           FROM breakthroughs
           WHERE upper(symbol::text) = s.symbol
           ORDER BY created_at DESC
           LIMIT 5
         ) b
       ) AS breakthroughs,
       (
         SELECT COALESCE(json_agg(n), '[]'::json) FROM (
           SELECT id, symbol, title_en, title_ar, price, published_date
           FROM news
           WHERE upper(symbol::text) = s.symbol
           ORDER BY published_date DESC
           LIMIT 5
         ) n
       ) AS news
     FROM stocks s
     LEFT JOIN price_cache_simple p ON p.symbol = s.symbol
     LEFT JOIN user_watchlist w ON w.symbol = s.symbol AND w.user_id = $2::int
     WHERE s.symbol = $1`,
    [normalized, userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    symbol: row.symbol,
    name_en: row.name_en,
    name_ar: row.name_ar,
    is_active: row.is_active,
    price: row.current_price === null ? null : pickPrice(row),
    is_watched: row.is_watched,
    alerts_enabled: row.alerts_enabled,
    announcements: row.announcements,
    daily_updates: row.daily_updates,
    breakthroughs: row.breakthroughs,
    news: row.news,
  };
}

function pickPrice(row: Record<string, unknown>): CachedPrice {
  return {
    current_price: row.current_price as string | null,
    previous_close_price: row.previous_close_price as string | null,
    change_amount: row.change_amount as string | null,
    change_percent: row.change_percent as string | null,
    currency: row.currency as string | null,
    market_status: row.market_status as string | null,
    fetched_at: row.fetched_at as string | null,
  };
}

/** The user's watched symbols with names and cached prices, in one query. */
export async function getWatchlist(userId: number): Promise<WatchlistEntry[]> {
  const { rows } = await pool.query(
    `SELECT w.symbol, w.alerts_enabled, w.created_at,
            s.name_en, s.name_ar,
            p.current_price, p.previous_close_price, p.change_amount,
            p.change_percent, p.currency, p.market_status, p.fetched_at
     FROM user_watchlist w
     JOIN stocks s ON s.symbol = w.symbol
     LEFT JOIN price_cache_simple p ON p.symbol = w.symbol
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    symbol: row.symbol,
    name_en: row.name_en,
    name_ar: row.name_ar,
    alerts_enabled: row.alerts_enabled,
    created_at: row.created_at,
    price: row.current_price === null ? null : pickPrice(row),
  }));
}

/**
 * Adds a symbol to the watchlist, capped at WATCHLIST_MAX_SYMBOLS.
 *
 * The cap is enforced in the same statement as the insert, so two concurrent
 * requests cannot both squeeze past it.
 */
export async function addToWatchlist(
  userId: number,
  symbol: string
): Promise<WatchlistAddResult> {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return { status: "unknown_symbol" };

  try {
    const { rows } = await pool.query(
      `WITH current AS (
         SELECT COUNT(*)::int AS n,
                COUNT(*) FILTER (WHERE symbol = $2)::int AS mine
         FROM user_watchlist
         WHERE user_id = $1
       ), known AS (
         SELECT 1 FROM stocks WHERE symbol = $2
       ), ins AS (
         INSERT INTO user_watchlist (user_id, symbol)
         SELECT $1, $2
         FROM current
         WHERE n < $3 AND EXISTS (SELECT 1 FROM known)
         ON CONFLICT (user_id, symbol) DO NOTHING
         RETURNING symbol
       )
       SELECT (SELECT n FROM current) AS count_before,
              (SELECT mine FROM current) > 0 AS already_watched,
              EXISTS (SELECT 1 FROM known) AS symbol_known,
              (SELECT COUNT(*)::int FROM ins) AS inserted`,
      [userId, normalized, WATCHLIST_MAX_SYMBOLS]
    );

    const row = rows[0];
    if (!row.symbol_known) return { status: "unknown_symbol" };
    if (row.already_watched) return { status: "already_watched" };
    if (row.inserted === 0) {
      return { status: "limit_reached", limit: WATCHLIST_MAX_SYMBOLS };
    }
    return { status: "added" };
  } catch (err) {
    // 23503 = foreign key violation: the symbol disappeared between the
    // existence check and the insert.
    if ((err as { code?: string }).code === "23503") {
      return { status: "unknown_symbol" };
    }
    throw err;
  }
}

/** Returns false when the symbol was not on the watchlist to begin with. */
export async function removeFromWatchlist(
  userId: number,
  symbol: string
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM user_watchlist WHERE user_id = $1 AND symbol = $2`,
    [userId, normalizeSymbol(symbol)]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Returns false when the symbol is not on the user's watchlist. */
export async function setWatchAlerts(
  userId: number,
  symbol: string,
  alertsEnabled: boolean
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE user_watchlist SET alerts_enabled = $3
     WHERE user_id = $1 AND symbol = $2`,
    [userId, normalizeSymbol(symbol), alertsEnabled]
  );
  return (result.rowCount ?? 0) > 0;
}
