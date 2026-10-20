import pool from '../db';
import { createNotificationForAll } from './notification.service';
import { sendBilingualPushToUsers } from './push.service';

/**
 * Content alerts: the fan-out from "an admin published something" to the users
 * who asked to hear about it.
 *
 * Two rules shape everything here:
 *
 *  1. **One notification per user per publish event.** A bulk insert of ten
 *     daily updates, or an announcement touching three symbols one user
 *     watches, produces exactly one notification for that user — never one per
 *     row. The affected symbols are named in the body instead ("MRNA, PFE, LLY
 *     +4 more").
 *  2. **Never break the request that triggered it.** Call sites invoke these
 *     after COMMIT and fire-and-forget (`void notifyWatchers(...).catch(...)`),
 *     so a dead Expo connection or a notification bug cannot fail or slow an
 *     admin publish.
 */

/** How many symbols are named before collapsing into "+N more". */
const MAX_NAMED_SYMBOLS = 3;

export interface BilingualText {
  en: string;
  ar: string;
}

export interface NotifyWatchersInput {
  /** The symbols this publish event touched. Case-insensitive. */
  symbols: Array<string | null | undefined>;
  /** `in_app_notifications.type`, e.g. `announcement`. */
  type: string;
  title: BilingualText;
  /** Built per user from the subset of symbols that user actually watches. */
  body: (symbols: string[]) => BilingualText;
  /** Push/tap payload. A function when it depends on the matched symbols. */
  data?: Record<string, unknown> | ((symbols: string[]) => Record<string, unknown>);
}

/**
 * Formats a symbol list for notification copy.
 *
 * EN: "MRNA, PFE, LLY +4 more"
 * AR: "MRNA وPFE وLLY و4 أخرى"  (Arabic joins with the و prefix, no comma)
 */
export function formatSymbolList(symbols: string[], lang: 'en' | 'ar'): string {
  const named = symbols.slice(0, MAX_NAMED_SYMBOLS);
  const rest = symbols.length - named.length;

  if (lang === 'ar') {
    const head = named.join(' و');
    return rest > 0 ? `${head} و${rest} أخرى` : head;
  }

  const head = named.join(', ');
  return rest > 0 ? `${head} +${rest} more` : head;
}

/**
 * Notifies every user watching any of `symbols` with alerts on.
 *
 * One grouped query finds the watchers and the symbols each one matched, one
 * INSERT writes all the in-app rows, and pushes go out one call per distinct
 * body (users who matched the same symbols share a payload).
 */
export async function notifyWatchers(input: NotifyWatchersInput): Promise<void> {
  const symbols = [
    ...new Set(
      input.symbols
        .map((s) => (s ?? '').trim().toUpperCase())
        .filter((s) => s.length > 0)
    ),
  ];
  if (symbols.length === 0) return;

  const { rows } = await pool.query(
    `SELECT user_id, array_agg(symbol ORDER BY symbol) AS symbols
     FROM user_watchlist
     WHERE alerts_enabled AND symbol = ANY($1::text[])
     GROUP BY user_id`,
    [symbols]
  );
  if (rows.length === 0) return;

  const recipients = (rows as Array<{ user_id: number; symbols: string[] }>).map(
    (row) => {
      const body = input.body(row.symbols);
      const data =
        typeof input.data === 'function' ? input.data(row.symbols) : input.data ?? {};
      return { userId: row.user_id, body, data };
    }
  );

  // One INSERT … SELECT FROM unnest(...) for every recipient. `title`/`body`
  // (the pre-bilingual columns) carry the English copy, matching
  // notification.service.ts.
  await pool.query(
    `INSERT INTO in_app_notifications
       (user_id, type, title, body, title_en, title_ar, body_en, body_ar, data)
     SELECT r.user_id, $1, $2, r.body_en, $2, $3, r.body_en, r.body_ar, r.data::jsonb
     FROM unnest($4::int[], $5::text[], $6::text[], $7::text[])
       AS r(user_id, body_en, body_ar, data)`,
    [
      input.type,
      input.title.en,
      input.title.ar,
      recipients.map((r) => r.userId),
      recipients.map((r) => r.body.en),
      recipients.map((r) => r.body.ar),
      recipients.map((r) => JSON.stringify(r.data)),
    ]
  );

  // Users whose body and data came out identical (the common case: everyone
  // watching the single symbol that was just published) share one push call.
  const groups = new Map<
    string,
    { userIds: number[]; body: BilingualText; data: Record<string, unknown> }
  >();
  for (const r of recipients) {
    const key = JSON.stringify([r.body.en, r.body.ar, r.data]);
    const group = groups.get(key);
    if (group) group.userIds.push(r.userId);
    else groups.set(key, { userIds: [r.userId], body: r.body, data: r.data });
  }

  for (const group of groups.values()) {
    await sendBilingualPushToUsers(group.userIds, {
      en: { title: input.title.en, body: group.body.en },
      ar: { title: input.title.ar, body: group.body.ar },
      data: group.data,
    });
  }
}

export interface NotifyAllDailyUpdatesInput {
  /** Day key as computed by lib/mobile/day-window.ts (`YYYY-MM-DD`). */
  date: string;
  symbols: Array<string | null | undefined>;
}

/**
 * Daily updates go to every user, not just watchers, so this wraps
 * `createNotificationForAll` — and is called once per request, never per row.
 *
 * Because every user already hears about these, daily updates deliberately do
 * *not* also fire `notifyWatchers`: one push per publish event.
 */
export async function notifyAllDailyUpdates(
  input: NotifyAllDailyUpdatesInput
): Promise<void> {
  const symbols = [
    ...new Set(
      input.symbols
        .map((s) => (s ?? '').trim().toUpperCase())
        .filter((s) => s.length > 0)
    ),
  ];

  const listEn = formatSymbolList(symbols, 'en');
  const listAr = formatSymbolList(symbols, 'ar');

  await createNotificationForAll({
    type: 'daily_updates',
    title_en: 'New daily updates',
    title_ar: 'تحديثات يومية جديدة',
    body_en: symbols.length ? `Updates for ${listEn}` : 'New daily updates are available',
    body_ar: symbols.length ? `تحديثات لأسهم ${listAr}` : 'تحديثات يومية جديدة متاحة الآن',
    data: { screen: 'daily-updates', date: input.date },
  });
}

/**
 * Shared `.catch()` for the fire-and-forget call sites, so a failed fan-out is
 * visible in the logs without touching the response.
 */
export function logAlertFailure(context: string) {
  return (err: unknown) => {
    console.error(`[content-alert] ${context} failed`, err);
  };
}
