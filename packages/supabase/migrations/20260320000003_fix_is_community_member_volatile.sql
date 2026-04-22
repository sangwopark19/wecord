-- Fix: is_community_member() was marked STABLE, which allows PostgreSQL to cache
-- the result within a single INSERT...RETURNING statement.
--
-- During INSERT INTO community_members ... RETURNING *, PostgreSQL evaluates the
-- SELECT RLS policy for the returned rows. If the planner cached the result of
-- is_community_member() from before the INSERT occurred (as STABLE allows), it
-- would return false for a fresh join, causing RETURNING to yield 0 rows.
-- PostgREST's .select().single() then returns PGRST116 (no rows found), which
-- surfaces as a generic error alert on the client.
--
-- Fix: mark the function VOLATILE so PostgreSQL always re-executes it and never
-- caches the result — even within a single INSERT...RETURNING statement.
-- Performance impact is negligible: the function is called once per row and runs
-- a simple EXISTS query on an indexed table.

CREATE OR REPLACE FUNCTION is_community_member(p_community_id uuid)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND user_id = (select auth.uid())
  );
$$;
