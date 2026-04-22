-- Phase 7 / D-37 / T-7-02: LOCAL-ONLY SQL smoke helper for delete_account RPC.
--
-- Lives in packages/supabase/tests/sql/ (NOT a migration — Supabase CLI never
-- applies it). Loaded only by packages/supabase/tests/run-delete-account-smoke.sh,
-- which refuses to run unless SUPABASE_ENV=local AND drops the function after
-- the test so even local DBs do not persist it.
--
-- The helper inserts a synthetic user across every table delete_account()
-- touches, invokes the RPC, asserts every row is gone, and cleans up the
-- auth.users row (the RPC does NOT touch auth.users — that is
-- auth.admin.deleteUser's responsibility in the Edge Function).
--
-- Guarded by current_setting('app.env', true) = 'local' as a defense-in-depth
-- check on top of the shell-level SUPABASE_ENV guard.

CREATE OR REPLACE FUNCTION public.wv_test_delete_account_smoke()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_env text := current_setting('app.env', true);
  v_count integer;
  v_member_id uuid;
  v_community_id uuid;
BEGIN
  -- Environment guard — this helper MUST NOT run in production
  IF v_env IS NULL OR v_env <> 'local' THEN
    RAISE EXCEPTION
      'wv_test_delete_account_smoke: smoke test only runs in local dev (app.env must be ''local'', got %)',
      COALESCE(v_env, 'NULL');
  END IF;

  BEGIN
    -- 1. Seed synthetic auth.users + profile
    INSERT INTO auth.users (id, email, created_at, updated_at, aud, role)
      VALUES (v_user_id, 'smoke-' || v_user_id || '@local.test', now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.profiles (user_id, global_nickname, language, onboarding_completed)
      VALUES (v_user_id, 'smoke-user', 'ko', true);

    -- 2. Seed community membership (requires an existing community)
    SELECT id INTO v_community_id FROM public.communities LIMIT 1;
    IF v_community_id IS NOT NULL THEN
      INSERT INTO public.community_members (user_id, community_id, community_nickname, role)
        VALUES (v_user_id, v_community_id, 'smoke', 'member')
        RETURNING id INTO v_member_id;

      INSERT INTO public.notification_preferences (user_id, community_id, creator_posts, comments, likes, notices)
        VALUES (v_user_id, v_community_id, true, true, true, true);

      -- self-follow to test follower_cm_id + following_cm_id paths
      IF v_member_id IS NOT NULL THEN
        INSERT INTO public.community_follows (follower_cm_id, following_cm_id)
          VALUES (v_member_id, v_member_id);
      END IF;
    END IF;

    -- 3. Invoke delete_account
    PERFORM public.delete_account(v_user_id);

    -- 4. Assert zero rows remain in each touched table
    SELECT count(*) INTO v_count FROM public.profiles WHERE user_id = v_user_id;
    IF v_count <> 0 THEN RAISE EXCEPTION 'profiles not cleaned up: % rows', v_count; END IF;

    SELECT count(*) INTO v_count FROM public.community_members WHERE user_id = v_user_id;
    IF v_count <> 0 THEN RAISE EXCEPTION 'community_members not cleaned up: % rows', v_count; END IF;

    SELECT count(*) INTO v_count FROM public.notification_preferences WHERE user_id = v_user_id;
    IF v_count <> 0 THEN RAISE EXCEPTION 'notification_preferences not cleaned up: % rows', v_count; END IF;

    IF v_member_id IS NOT NULL THEN
      SELECT count(*) INTO v_count FROM public.community_follows
        WHERE follower_cm_id = v_member_id OR following_cm_id = v_member_id;
      IF v_count <> 0 THEN RAISE EXCEPTION 'community_follows not cleaned up: % rows', v_count; END IF;
    END IF;

    -- 5. Clean up the synthetic auth.users row (delete_account does not touch auth.users)
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    -- Best-effort cleanup so repeated local runs stay idempotent
    DELETE FROM public.profiles WHERE user_id = v_user_id;
    DELETE FROM public.community_members WHERE user_id = v_user_id;
    DELETE FROM public.notification_preferences WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE;
  END;
END;
$$;

-- Lock down: not callable by clients (the runner connects as superuser/service_role anyway)
REVOKE ALL ON FUNCTION public.wv_test_delete_account_smoke() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wv_test_delete_account_smoke() TO service_role;

COMMENT ON FUNCTION public.wv_test_delete_account_smoke() IS
  'D-37 / T-7-02 test helper — invokes delete_account on a synthetic user and asserts clean cascade. Guarded by current_setting(''app.env'') = ''local''. Local dev + CI only; dropped by runner after each invocation.';
