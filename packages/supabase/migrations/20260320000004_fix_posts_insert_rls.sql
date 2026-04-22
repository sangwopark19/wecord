-- Fix: posts INSERT RLS fails with 403 because user_sanctions_select policy
-- references auth.users, which authenticated role cannot access directly.
-- Solution: use a SECURITY DEFINER function to check sanctions.

CREATE OR REPLACE FUNCTION public.is_user_sanctioned(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_sanctions us
    WHERE us.user_id = uid
      AND us.type <> 'warning'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  );
$$;

-- Re-create posts_insert_member policy using the new function
DROP POLICY IF EXISTS posts_insert_member ON posts;
CREATE POLICY posts_insert_member ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = posts.community_id
        AND cm.user_id = auth.uid()
        AND cm.community_nickname IS NOT NULL
    )
    AND (
      author_role = 'fan'
      OR (
        author_role = 'creator'
        AND EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = posts.community_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'creator'
        )
      )
    )
    AND NOT is_user_sanctioned(auth.uid())
  );
