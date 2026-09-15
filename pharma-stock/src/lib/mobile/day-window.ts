/**
 * Canonical "day" definition for the mobile daily-updates feed.
 *
 * `daily_updates.published_date` is a `timestamptz`, so it carries no calendar
 * day of its own — an instant is only "the 14th" relative to some timezone.
 * Until now nothing in the backend picked one: both the mobile and the web
 * daily-updates routes used a rolling `NOW() - INTERVAL '24 hours'` window,
 * which sidesteps the question entirely and is why an older day was
 * unreachable.
 *
 * The app now pins the boundary to Asia/Riyadh, matching the hours the admin
 * team actually publishes on, so "today" means the same calendar day to the
 * publisher and to the reader regardless of either one's device timezone.
 * Riyadh is UTC+03 year-round with no DST, so day boundaries are stable and
 * there are no ambiguous or skipped local times to handle.
 *
 * Change APP_TIMEZONE here and both the list endpoint and available-dates move
 * together; nothing else hardcodes a zone.
 */
export const APP_TIMEZONE = 'Asia/Riyadh';

/** Largest span `available-dates` will scan, to bound the group-by. */
export const MAX_AVAILABLE_DATE_RANGE_DAYS = 90;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Today's calendar date in APP_TIMEZONE as `YYYY-MM-DD`.
 * 'en-CA' is used purely because it formats as ISO-like YYYY-MM-DD.
 */
export function todayInAppTimezone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Validates a `YYYY-MM-DD` string, rejecting both malformed input and
 * well-formed-but-nonexistent dates (2026-02-30, 2026-13-01). Returns null when
 * invalid so callers can answer 400 rather than silently falling back.
 */
export function parseDateParam(raw: string | null): string | null {
  if (!raw || !DATE_PATTERN.test(raw)) return null;

  const [year, month, day] = raw.split('-').map(Number);
  // Round-trip through UTC: if the calendar date doesn't exist, the Date
  // constructor rolls it over and the parts no longer match.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return raw;
}

/** Whole days between two `YYYY-MM-DD` strings (to = later). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Adds `days` to a `YYYY-MM-DD` string, returning `YYYY-MM-DD`. */
export function addDays(date: string, days: number): string {
  const d = new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}
