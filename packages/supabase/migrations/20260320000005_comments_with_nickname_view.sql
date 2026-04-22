-- Create a view for comments with author nickname, mirroring posts_with_nickname pattern
CREATE OR REPLACE VIEW comments_with_nickname AS
SELECT
  c.*,
  cm.community_nickname AS author_nickname,
  cm.id AS author_cm_id,
  cm.role AS member_role
FROM comments c
JOIN posts p ON p.id = c.post_id
JOIN community_members cm ON cm.user_id = c.author_id AND cm.community_id = p.community_id;
