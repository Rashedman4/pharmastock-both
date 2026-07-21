-- Mobile Web Handoff Migration — single-use tokens for mobile→web silent sign-in
-- Apply with: psql $DATABASE_URL -f pharma-stock/migrations/mobile_web_handoff_tokens.sql

CREATE TABLE IF NOT EXISTS mobile_web_handoff_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'ELITE_PAYMENT',
  redirect_path TEXT NOT NULL,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handoff_tokens_hash ON mobile_web_handoff_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_handoff_tokens_user ON mobile_web_handoff_tokens(user_id);
