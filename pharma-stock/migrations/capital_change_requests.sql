-- Capital change requests — investor-submitted requests to change their Elite
-- portfolio's free capital, subject to admin approval.
-- Apply with: psql $DATABASE_URL -f pharma-stock/migrations/capital_change_requests.sql
--
-- Replaces the previous behavior where PATCH /api/elite/portfolio let an
-- investor overwrite elite_portfolios_simple.current_capital_amount directly
-- (a self-service absolute overwrite with no admin oversight, and no locking
-- against concurrent trade-execution capital updates). Now the investor
-- creates a PENDING request here; only an admin approval actually calls
-- setFreeCapital().

CREATE TABLE IF NOT EXISTS capital_change_requests (
  id SERIAL PRIMARY KEY,
  elite_member_id INTEGER NOT NULL REFERENCES elite_members(id) ON DELETE CASCADE,
  portfolio_id INTEGER NOT NULL REFERENCES elite_portfolios_simple(id) ON DELETE CASCADE,
  investor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_capital_amount NUMERIC(18,2) NOT NULL,
  requested_capital_amount NUMERIC(18,2) NOT NULL CHECK (requested_capital_amount >= 0),
  request_note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DB-level backstop (matches the pattern used by ux_signals_symbol_upper):
-- at most one PENDING request per portfolio at a time, enforced even under
-- concurrent submissions.
CREATE UNIQUE INDEX IF NOT EXISTS ux_capital_change_requests_pending
  ON capital_change_requests(portfolio_id) WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_capital_change_requests_portfolio
  ON capital_change_requests(portfolio_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capital_change_requests_investor
  ON capital_change_requests(investor_user_id, status, created_at DESC);
