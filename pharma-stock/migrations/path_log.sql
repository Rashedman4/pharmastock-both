-- ============================================================
-- MISSING MIGRATION — path_log (page-view analytics)
-- ============================================================
-- Reconstructed from production. `path_log` has been written to by
-- POST /api/log (src/app/api/log/route.ts, called from the PageTracker
-- component mounted in the root layout) since ~Aug 2025, but it was never
-- checked in as a migration and it is absent from the schema exports.
--
-- The only DDL that existed for it lived loose outside the repo
-- (Desktop/Father/pharmastock-files/page-tracking.sql) and was already stale:
-- it predates the country/region/ip/user_agent columns the route inserts
-- today, so applying that file to a fresh database produced a table that
-- /api/log cannot write to.
--
-- This file matches production (verified against the 2026-08-24 export,
-- 62,869 rows) and is re-runnable: on production every statement is a no-op
-- except the indexes, which production does not have.
--
-- Apply with: psql "$DATABASE_URL" -f migrations/path_log.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS path_log (
    id          SERIAL PRIMARY KEY,
    path        TEXT NOT NULL,
    user_id     INTEGER,
    visited_at  TIMESTAMPTZ DEFAULT NOW(),
    country     TEXT,
    region      TEXT,
    ip          TEXT,
    user_agent  TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users (id)
);

-- Columns added after the original CREATE TABLE. Guarded so this file can be
-- applied to a database that already has the older three-column shape.
ALTER TABLE path_log
    ADD COLUMN IF NOT EXISTS country    TEXT,
    ADD COLUMN IF NOT EXISTS region     TEXT,
    ADD COLUMN IF NOT EXISTS ip         TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ------------------------------------------------------------
-- Indexes for the admin monitor page (src/app/admin/monitor).
--
-- Production has none of these — every filter/sort was a sequential scan over
-- the whole table. All three are the leading column of a WHERE/ORDER BY the
-- monitor page issues, and visited_at also drives the "delete logs older than
-- N days" prune, which would otherwise scan the table to find its victims.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_path_log_visited_at
    ON path_log (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_path_log_user_id
    ON path_log (user_id, visited_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_path_log_path
    ON path_log (path, visited_at DESC);

COMMIT;

-- ------------------------------------------------------------
-- NOT run automatically: on a table this size, building the three indexes
-- above inside the transaction takes a brief exclusive lock and /api/log
-- writes will block for its duration (seconds at 63k rows). If you would
-- rather avoid even that, skip the CREATE INDEX statements above and run
-- these instead, outside any transaction:
--
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_path_log_visited_at
--       ON path_log (visited_at DESC);
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_path_log_user_id
--       ON path_log (user_id, visited_at DESC) WHERE user_id IS NOT NULL;
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_path_log_path
--       ON path_log (path, visited_at DESC);
-- ------------------------------------------------------------
