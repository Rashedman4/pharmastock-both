-- ============================================================
-- Stock universe, per-user watchlists and company announcements
-- ============================================================
-- Adds the three tables behind stock search, watchlist alerts and the
-- company-announcements content type:
--
--   stocks                -- the covered universe (US biopharma only). Search
--                            runs against this table and nothing else, so an
--                            uncovered ticker is simply not findable.
--   user_watchlist        -- which symbols a user follows, and whether that
--                            follow should produce notifications.
--   company_announcements -- bilingual Markdown announcements per symbol.
--
-- `stocks` is seeded from the symbols already present in the existing content
-- tables; from then on `ensureStocks()` (src/modules/stocks/stocks.service.ts)
-- keeps it filled from every admin content insert. The seed and ensureStocks
-- both use ON CONFLICT DO NOTHING, so an admin-corrected name is never
-- overwritten by a later insert.
--
-- Idempotent: safe to apply twice.
-- Apply with: psql "$DATABASE_URL" -f migrations/stocks_watchlist_announcements.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- stocks — covered-stock universe
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stocks (
  symbol      VARCHAR(20) PRIMARY KEY,
  name_en     TEXT NOT NULL,
  name_ar     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prefix search on the English name. The table stays small (hundreds of rows),
-- so plain ILIKE/`lower() LIKE` over it is cheap and pg_trgm is not needed.
CREATE INDEX IF NOT EXISTS idx_stocks_name_en_pattern
  ON stocks (lower(name_en) text_pattern_ops);

-- ------------------------------------------------------------
-- user_watchlist
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol          VARCHAR(20) NOT NULL REFERENCES stocks(symbol) ON UPDATE CASCADE,
  alerts_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, symbol)
);

-- Alert fan-out looks up watchers by symbol, and only ever wants the rows with
-- alerts on, so the partial index is both smaller and sufficient.
CREATE INDEX IF NOT EXISTS idx_user_watchlist_symbol_alerts
  ON user_watchlist (symbol)
  WHERE alerts_enabled;

-- ------------------------------------------------------------
-- company_announcements
--
-- title_*/content_* hold the verbatim original English and its Arabic
-- translation; content_* is Markdown (never HTML — both clients render it with
-- raw HTML disabled).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_announcements (
  id              SERIAL PRIMARY KEY,
  symbol          VARCHAR(20) NOT NULL,
  title_en        TEXT NOT NULL,
  title_ar        TEXT NOT NULL,
  content_en      TEXT NOT NULL,
  content_ar      TEXT NOT NULL,
  source_url      TEXT,
  announced_at    TIMESTAMPTZ,
  published_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_announcements_published_date
  ON company_announcements (published_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_announcements_symbol
  ON company_announcements (symbol, published_date DESC);

-- ------------------------------------------------------------
-- Per-symbol lookups for the stock page
--
-- The stock page reads the latest items for one symbol out of the existing
-- content tables. Those tables store the symbol as the admin typed it, so the
-- match has to be made on upper(symbol) and the plain symbol indexes cannot
-- serve it. `stocks.symbol` is always upper-case, which is the other side of
-- these comparisons.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_news_symbol_upper
  ON news (upper(symbol::text), published_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_updates_symbol_upper
  ON daily_updates (upper(symbol::text), published_date DESC);
CREATE INDEX IF NOT EXISTS idx_breakthroughs_symbol_upper
  ON breakthroughs (upper(symbol::text), created_at DESC);

-- ------------------------------------------------------------
-- Admin "sent notifications" history
--
-- /admin/notifications lists the recent admin-authored sends by grouping
-- in_app_notifications on (title, body, created_at). Without this index that
-- listing is a sequential scan over every notification ever written.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_type_created
  ON in_app_notifications (type, created_at DESC);

-- ------------------------------------------------------------
-- Seed the universe from the symbols already in use.
--
-- `breakthroughs` goes first because it is the only table carrying a company
-- name; the rest fall back to the symbol itself and admins fix the names in
-- /admin/stocks. Every statement is ON CONFLICT DO NOTHING, so re-running this
-- file never touches a row that already exists.
-- ------------------------------------------------------------
INSERT INTO stocks (symbol, name_en)
SELECT DISTINCT ON (upper(btrim(symbol::text)))
       upper(btrim(symbol::text)),
       COALESCE(NULLIF(btrim(company), ''), upper(btrim(symbol::text)))
FROM breakthroughs
WHERE symbol IS NOT NULL AND btrim(symbol::text) <> ''
ORDER BY upper(btrim(symbol::text)), created_at DESC NULLS LAST
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO stocks (symbol, name_en)
SELECT DISTINCT upper(btrim(symbol::text)), upper(btrim(symbol::text))
FROM daily_updates
WHERE symbol IS NOT NULL AND btrim(symbol::text) <> ''
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO stocks (symbol, name_en)
SELECT DISTINCT upper(btrim(symbol::text)), upper(btrim(symbol::text))
FROM news
WHERE symbol IS NOT NULL AND btrim(symbol::text) <> ''
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO stocks (symbol, name_en)
SELECT DISTINCT upper(btrim(symbol::text)), upper(btrim(symbol::text))
FROM signals
WHERE symbol IS NOT NULL AND btrim(symbol::text) <> ''
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO stocks (symbol, name_en)
SELECT DISTINCT upper(btrim(symbol::text)), upper(btrim(symbol::text))
FROM signal_history
WHERE symbol IS NOT NULL AND btrim(symbol::text) <> ''
ON CONFLICT (symbol) DO NOTHING;

COMMIT;
