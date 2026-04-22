-- Fix: community_members_select RLS policy was self-referential, causing
-- infinite recursion when PostgREST SELECTs back the inserted row
-- (INSERT...?select=* pattern in useJoinCommunity.ts).
--
-- The original policy:
--   USING (EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = ... AND cm.user_id = auth.uid()))
-- queries community_members from WITHIN the community_members RLS policy,
-- triggering the policy again → stack overflow → 500 Internal Server Error.
--
-- Fix: introduce a SECURITY DEFINER helper function that bypasses RLS,
-- then use it in the policy to break the recursion.
-- Note: set-returning functions are not allowed in policy USING expressions,
-- so the helper returns boolean directly to check membership.

-- Helper function: returns true if the current user is a member of the given community.
-- SECURITY DEFINER bypasses RLS so it does not re-trigger the community_members policy.
CREATE OR REPLACE FUNCTION is_community_member(p_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = (select auth.uid())
  );
$$;

-- Drop and recreate the recursive policy with a non-recursive equivalent.
DROP POLICY IF EXISTS "community_members_select" ON "community_members";

CREATE POLICY "community_members_select" ON "community_members"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (
    is_community_member("community_members"."community_id")
  );
