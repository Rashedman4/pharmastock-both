-- ============================================================
-- Login tracking — auth_log + users.last_login_at
-- ============================================================
-- Nothing in the codebase recorded logins before this: `users` had no
-- last-login column, and elite_activity_logs only covers actions on Elite
-- entities. This backs the "Latest logins" panel on the admin monitor page
-- (src/app/admin/monitor).
--
-- Written fire-and-forget from src/lib/services/auth-log.service.ts, which is
-- called by:
--   web    — src/lib/nextAuth.ts (Credentials authorize + the signIn callback,
--            covering credentials / google / apple / mobile-handoff)
--   mobile — src/app/api/mobile/v1/auth/{login,google,apple}/route.ts
--
-- Apply with: psql "$DATABASE_URL" -f migrations/auth_log.sql
-- Re-runnable.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- users.last_login_at
--
-- Denormalized "most recent successful login" so the monitor page's per-user
-- view and the active/dormant user counts are a single indexed scan of
-- `users`, instead of a DISTINCT ON over an ever-growing auth_log.
-- Maintained in the same round trip as the auth_log insert (see the CTE in
-- auth-log.service.ts).
-- ------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_login_at
    ON users (last_login_at DESC NULLS LAST);

-- ------------------------------------------------------------
-- auth_log
--
-- One row per login ATTEMPT, successful or not. user_id is null for a failed
-- attempt against an address that matches no account (email_attempted keeps
-- what was typed, so repeated probing is visible); ON DELETE SET NULL keeps
-- the row when an account is hard-deleted.
--
-- Note the account-deletion flow anonymizes rather than deletes
-- (see migrations/account_deletion.sql), so in practice rows survive with
-- their user_id intact.
-- ------------------------------------------------------------
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

-- Drives the "Latest logins" list (newest first) and the monitor page's
-- 24h/7d login counters.
CREATE INDEX IF NOT EXISTS idx_auth_log_created_at
    ON auth_log (created_at DESC);

-- Per-user login history.
CREATE INDEX IF NOT EXISTS idx_auth_log_user
    ON auth_log (user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- Failed-attempt review; partial so it stays small next to the success rows.
CREATE INDEX IF NOT EXISTS idx_auth_log_failures
    ON auth_log (created_at DESC)
    WHERE success = false;

COMMIT;
