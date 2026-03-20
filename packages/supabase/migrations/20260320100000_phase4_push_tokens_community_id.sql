-- push_tokens table for Expo push notification token storage
CREATE TABLE push_tokens (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id)
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_upsert_own" ON push_tokens FOR ALL
  TO authenticated USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "push_tokens_anon_block" ON push_tokens FOR ALL
  TO anon USING (false);

-- Add community_id to notifications for efficient per-community filtering
ALTER TABLE notifications ADD COLUMN community_id uuid REFERENCES communities(id);
CREATE INDEX idx_notifications_community ON notifications(user_id, community_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable pgmq and pg_cron extensions
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
