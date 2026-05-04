-- Patch: add custom_user_ids column to broadcast_campaigns
-- Run with: psql $DATABASE_URL -f migrations/mobile_v1_patch.sql
ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS custom_user_ids INTEGER[] DEFAULT '{}';
