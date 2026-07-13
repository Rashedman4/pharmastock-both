-- Prevent multiple open signals for the same symbol
-- Run with: psql $DATABASE_URL -f migrations/signals_unique_symbol.sql

-- ============================================================
-- SIGNALS: unique symbol (case-insensitive)
-- `signals` only ever holds currently-open signals — closing one deletes
-- the row here and inserts into `signal_history` instead. Two open rows
-- for the same symbol is therefore always a bug. The application layer
-- already checks for this before inserting (see
-- src/app/api/admin/signals/route.ts); this index is the DB-level backstop
-- so no future code path can violate it.
--
-- NOTE: if this fails with a uniqueness violation, there is already more
-- than one open signal for some symbol in the table — resolve that
-- (close/merge the duplicates) before re-running this migration.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS ux_signals_symbol_upper ON signals (UPPER(symbol));
