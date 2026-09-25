-- ============================================================================
-- PHARMAsTOCK — admin monitor page: database changes
--
-- Combines migrations/path_log.sql + migrations/auth_log.sql into one script.
--
-- Run the WHOLE file as one block. It is fully idempotent, so it does not
-- matter what state the database is currently in — a partially applied earlier
-- attempt is fine, just run it again.
--
-- Pure SQL, single transaction, no CREATE INDEX CONCURRENTLY: works as-is in
-- pgAdmin, DBeaver, TablePlus, a hosted SQL console, or psql -f.
--
-- Measured at production scale (63,000 path_log rows): the three path_log
-- indexes build in 117 ms + 84 ms + 199 ms — about 0.4 s total, during which
-- /api/log writes queue rather than fail. That is why this uses plain
-- CREATE INDEX. CONCURRENTLY would avoid even that pause, but it cannot run
-- inside a transaction block, which is what most GUI clients wrap a script in.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- path_log — page-view analytics, written by POST /api/log.
--
-- Already exists in production (in use since ~Aug 2025) but was never a
-- migration, so the CREATE and the ALTERs below are no-ops there and will emit
-- "already exists, skipping" notices. That is expected. On a fresh database
-- they create the table properly.
-- ----------------------------------------------------------------------------
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

ALTER TABLE path_log
    ADD COLUMN IF NOT EXISTS country    TEXT,
    ADD COLUMN IF NOT EXISTS region     TEXT,
    ADD COLUMN IF NOT EXISTS ip         TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Production has no indexes on this table at all — every filter and sort on
-- the monitor page would otherwise be a sequential scan, and the "delete logs
-- older than N days" prune would scan the table just to find its victims.
CREATE INDEX IF NOT EXISTS idx_path_log_visited_at
    ON path_log (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_path_log_user_id
    ON path_log (user_id, visited_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_path_log_path
    ON path_log (path, visited_at DESC);

-- ----------------------------------------------------------------------------
-- users.last_login_at — denormalized "most recent successful login", written
-- in the same round trip as the auth_log insert.
--
-- Nullable with no default, so on PostgreSQL 11+ this is a metadata-only
-- change and does not rewrite the users table.
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_login_at
    ON users (last_login_at DESC NULLS LAST);

-- ----------------------------------------------------------------------------
-- auth_log — one row per login ATTEMPT, successful or not.
--
-- user_id is null when a failed attempt matched no account; email_attempted
-- keeps what was typed, so repeated probing stays visible. The table is empty
-- when created, so its indexes build instantly.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    client          VARCHAR(10) NOT NULL,
    method          VARCHAR(20) NOT NULL,
    success         BOOLEAN NOT NULL,
    email_attempted TEXT,
    failure_reason  TEXT,
    ip              TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT auth_log_client_check
        CHECK (client IN ('web', 'mobile')),
    CONSTRAINT auth_log_method_check
        CHECK (method IN ('credentials', 'google', 'apple', 'handoff', 'refresh'))
);

CREATE INDEX IF NOT EXISTS idx_auth_log_created_at
    ON auth_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_log_user
    ON auth_log (user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auth_log_failures
    ON auth_log (created_at DESC)
    WHERE success = false;

COMMIT;

-- ----------------------------------------------------------------------------
-- Verification. Read-only. Every row should say OK.
-- ----------------------------------------------------------------------------
SELECT
    CASE WHEN to_regclass('public.path_log') IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
    'table path_log' AS object
UNION ALL SELECT
    CASE WHEN to_regclass('public.auth_log') IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
    'table auth_log'
UNION ALL SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN 'OK' ELSE 'MISSING' END,
    'column users.last_login_at'
UNION ALL SELECT
    CASE WHEN count(*) = 3 THEN 'OK' ELSE 'MISSING (' || count(*) || '/3)' END,
    'path_log indexes'
    FROM pg_indexes
    WHERE tablename = 'path_log'
      AND indexname IN ('idx_path_log_visited_at', 'idx_path_log_user_id', 'idx_path_log_path')
UNION ALL SELECT
    CASE WHEN count(*) = 3 THEN 'OK' ELSE 'MISSING (' || count(*) || '/3)' END,
    'auth_log indexes'
    FROM pg_indexes
    WHERE tablename = 'auth_log'
      AND indexname IN ('idx_auth_log_created_at', 'idx_auth_log_user', 'idx_auth_log_failures')
UNION ALL SELECT
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'INVALID (' || count(*) || ') — drop and recreate them' END,
    'all path_log indexes valid'
    FROM pg_class c
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE c.relname LIKE 'idx_path_log%' AND NOT i.indisvalid;
