-- Daily Updates Migration
-- Run with: psql $DATABASE_URL -f migrations/daily_updates.sql

-- ============================================================
-- DAILY UPDATES
-- Admin-authored daily market updates per symbol, bilingual, no price field.
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_updates (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  subtitle_en TEXT,
  subtitle_ar TEXT,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  published_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_updates_published_date ON daily_updates(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_updates_symbol ON daily_updates(symbol);
