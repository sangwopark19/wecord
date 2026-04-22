-- Fix: drop banners_admin_all policy.
--
-- The original policy referenced auth.users from the authenticated role,
-- which lacks SELECT on auth.users. Postgres throws "permission denied for
-- table users" while evaluating the policy and the entire SELECT fails with
-- 403 — even though banners_select_authenticated would have allowed it.
--
-- Admin writes go through service_role (Edge Functions / dashboard), which
-- bypasses RLS, so a client-facing admin policy is unnecessary.

DROP POLICY IF EXISTS "banners_admin_all" ON public.promotion_banners;
