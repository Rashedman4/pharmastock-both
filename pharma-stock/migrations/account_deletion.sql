-- Account Deletion Migration: deleted_accounts archive table
-- Run with: psql $DATABASE_URL -f migrations/account_deletion.sql
--
-- Self-service account deletion (mobile Settings > Delete Account) anonymizes
-- the live `users` row rather than hard-deleting it, so that existing
-- transactions/subscriptions/elite history (which reference users.id) stay
-- intact for accounting/legal retention. This table keeps a minimal
-- record of who deleted their account and when.

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id SERIAL PRIMARY KEY,
  original_user_id INTEGER NOT NULL,
  email TEXT,
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  phonenumber VARCHAR(20),
  provider VARCHAR(50),
  account_created_at TIMESTAMP,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_original_user_id ON deleted_accounts(original_user_id);
