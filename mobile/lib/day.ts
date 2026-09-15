/**
 * Calendar-day helpers for the Daily Updates day selector.
 *
 * These must agree with the backend's day boundary
 * (pharma-stock/src/lib/mobile/day-window.ts, APP_TIMEZONE = 'Asia/Riyadh'),
 * otherwise the chip labelled "Today" would request a different day than the
 * one the server considers today.
 *
 * The offset is applied arithmetically rather than through
 * Intl.DateTimeFormat({ timeZone }), because named-timezone support in Hermes
 * is not dependable across platforms. That is safe here only because Saudi
 * Arabia is UTC+03 year-round and has never observed DST — if APP_TIMEZONE ever
 * moves to a zone with DST, this has to become a real timezone conversion.
 */
const APP_UTC_OFFSET_MINUTES = 3 * 60; // Asia/Riyadh, UTC+03, no DST

/** Number of days the day-chip strip shows. */
export const DAY_STRIP_LENGTH = 14;

/** How far back the calendar allows; matches the backend's range cap. */
export const MAX_HISTORY_DAYS = 90;

const MS_PER_DAY = 86_400_000;

/** Today's calendar date in the app timezone, as YYYY-MM-DD. */
export function todayKey(now: Date = new Date()): string {
  return new Date(now.getTime() + APP_UTC_OFFSET_MINUTES * 60_000)
    .toISOString()
    .slice(0, 10);
}

/** Adds (or subtracts) whole days to a YYYY-MM-DD key. */
export function addDays(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY
  );
}

/** Most recent `count` days, newest first. */
export function recentDays(count: number, from: string = todayKey()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(from, -i));
}

export interface DayParts {
  year: number;
  /** 1-12. */
  month: number;
  /** 1-31. */
  day: number;
  /** 0 = Sunday. */
  weekday: number;
}

export function parseKey(key: string): DayParts {
  const [year, month, day] = key.split('-').map(Number);
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

export function toKey(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** Days in a 1-12 month. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weekday (0 = Sunday) of the 1st of a 1-12 month. */
export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}
