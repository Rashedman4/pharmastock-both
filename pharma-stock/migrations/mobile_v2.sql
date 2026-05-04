-- Mobile v2 Migration: Broadcast Groups
-- Run with: psql $DATABASE_URL -f migrations/mobile_v2.sql

-- ============================================================
-- BROADCAST GROUPS
-- Named audience definitions. Admin creates once, sends many messages.
-- ============================================================
CREATE TABLE IF NOT EXISTS broadcast_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('all_users', 'elite_users', 'subscription_users', 'custom')),
  custom_user_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_groups_admin ON broadcast_groups(admin_id);

-- Link campaigns to their parent group (for message history per group)
ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES broadcast_groups(id);
CREATE INDEX IF NOT EXISTS idx_campaigns_group ON broadcast_campaigns(group_id);
