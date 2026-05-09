-- Mobile v2 Migration — Bilingual Notifications
-- Apply with: psql $DATABASE_URL -f pharma-stock/migrations/mobile_v2_bilingual_notifications.sql

-- Clear existing notifications (stale English-only data)
TRUNCATE TABLE in_app_notifications;

-- Add bilingual content columns
ALTER TABLE in_app_notifications
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS body_en  TEXT,
  ADD COLUMN IF NOT EXISTS body_ar  TEXT;

-- Track each user's language preference so the server can push in the right language
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
