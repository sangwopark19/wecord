-- Phase 6: Soft delete, banned words, analytics functions
-- 1. Add deleted_at to posts
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add deleted_at to comments
ALTER TABLE comments ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Update posts_with_nickname view to filter soft-deleted posts
CREATE OR REPLACE VIEW posts_with_nickname AS
SELECT p.*, cm.community_nickname AS author_nickname, cm.id AS author_cm_id,
       am.display_name AS artist_member_name, c.name AS community_name, c.slug AS community_slug
FROM posts p
JOIN community_members cm ON cm.user_id = p.author_id AND cm.community_id = p.community_id
LEFT JOIN artist_members am ON am.id = p.artist_member_id
JOIN communities c ON c.id = p.community_id
WHERE p.deleted_at IS NULL;

-- 4. Update comments_with_nickname view to filter soft-deleted comments
CREATE OR REPLACE VIEW comments_with_nickname AS
SELECT c.*, cm.community_nickname AS author_nickname, cm.id AS author_cm_id
FROM comments c
JOIN posts p ON p.id = c.post_id
JOIN community_members cm ON cm.user_id = c.author_id AND cm.community_id = p.community_id
WHERE c.deleted_at IS NULL;

-- 5. banned_words table
CREATE TABLE IF NOT EXISTS banned_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY banned_words_admin_select ON banned_words FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = (select auth.uid()) AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY banned_words_admin_insert ON banned_words FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE id = (select auth.uid()) AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY banned_words_admin_delete ON banned_words FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = (select auth.uid()) AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY banned_words_anon_block ON banned_words FOR ALL TO anon USING (false);

-- 6. contains_banned_word function (used by moderate Edge Function)
CREATE OR REPLACE FUNCTION contains_banned_word(p_content TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM banned_words
    WHERE p_content ILIKE '%' || word || '%'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 7. check_post_rate_limit function (used by moderate Edge Function, per D-22)
CREATE OR REPLACE FUNCTION check_post_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM posts
  WHERE author_id = p_user_id
    AND created_at > now() - interval '1 minute';
  RETURN recent_count < 5;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 8. Admin policy for posts UPDATE (soft delete) via service_role
-- Already exists as posts_update_admin in schema — service_role bypasses RLS anyway

-- 9. Analytics helper functions
CREATE OR REPLACE FUNCTION get_daily_active_users(start_date DATE, end_date DATE)
RETURNS TABLE(day DATE, count BIGINT) AS $$
  SELECT date_trunc('day', created_at)::date AS day,
         COUNT(DISTINCT author_id) AS count
  FROM posts
  WHERE created_at >= start_date AND created_at < end_date + 1
    AND deleted_at IS NULL
  GROUP BY day ORDER BY day;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_daily_signups(start_date DATE, end_date DATE)
RETURNS TABLE(day DATE, count BIGINT) AS $$
  SELECT date_trunc('day', created_at)::date AS day,
         COUNT(*) AS count
  FROM auth.users
  WHERE created_at >= start_date AND created_at < end_date + 1
  GROUP BY day ORDER BY day;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS TABLE(
  community_id UUID,
  community_name TEXT,
  member_count BIGINT,
  post_count BIGINT,
  comment_count BIGINT,
  report_count BIGINT
) AS $$
  SELECT
    c.id AS community_id,
    c.name AS community_name,
    (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count,
    (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id AND p.deleted_at IS NULL) AS post_count,
    (SELECT COUNT(*) FROM comments co
     JOIN posts p2 ON p2.id = co.post_id
     WHERE p2.community_id = c.id AND co.deleted_at IS NULL) AS comment_count,
    (SELECT COUNT(*) FROM reports r
     WHERE (r.target_type = 'post' AND r.target_id IN (SELECT p3.id FROM posts p3 WHERE p3.community_id = c.id))
        OR (r.target_type = 'comment' AND r.target_id IN (
          SELECT co2.id FROM comments co2 JOIN posts p4 ON p4.id = co2.post_id WHERE p4.community_id = c.id
        ))
    ) AS report_count
  FROM communities c
  ORDER BY member_count DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
