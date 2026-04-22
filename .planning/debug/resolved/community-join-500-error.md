---
status: awaiting_human_verify
trigger: "community-join-500-error"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — community_members_select RLS policy is self-referential, causing infinite recursion when PostgREST tries to SELECT back the inserted row (INSERT...RETURNING * pattern)
test: Trace the policy: it queries community_members from within community_members RLS, which triggers the policy again → infinite loop → PostgreSQL stack overflow → 500
expecting: Fix requires rewriting select policy to use SECURITY DEFINER helper function to break recursion
next_action: Write new migration that drops and recreates community_members_select policy with non-recursive implementation

## Symptoms

expected: 가입 버튼을 누르면 community_members에 row가 insert되고 커뮤니티 메인으로 이동
actual: iOS에서 오류 팝업, 웹/안드로이드에서 무반응. 웹 콘솔에 POST https://pvhpchindstbzurgybni.supabase.co/rest/v1/community_members?select=* 500 (Internal Server Error)
errors: 500 Internal Server Error on community_members INSERT
reproduction: 커뮤니티 검색 → 미리보기 → 가입 버튼 클릭
started: gap closure plans (03-06, 03-07) 실행 후에도 여전히 발생. 코드 수정은 적용되었으나 DB 측 문제로 추정

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-20T00:00:00Z
  checked: migrations directory
  found: Two migration files — 20260318141420_initial_schema.sql and 20260320000001_phase3_triggers_storage.sql
  implication: Phase 3 triggers migration contains member_count_trigger but this is not the cause of 500

- timestamp: 2026-03-20T00:01:00Z
  checked: initial_schema.sql community_members_select RLS policy (line 241-245)
  found: "USING (EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = community_members.community_id AND cm.user_id = (select auth.uid())))" — queries community_members FROM WITHIN the community_members policy
  implication: Self-referential policy. When PostgREST calls POST /community_members?select=* (with Prefer: return=representation), the SELECT fires this policy, which queries community_members, which fires this policy again → infinite recursion → PostgreSQL stack overflow → 500

- timestamp: 2026-03-20T00:02:00Z
  checked: useJoinCommunity.ts line 34-43
  found: .insert({...}).select().single() — the .select() causes PostgREST to use ?select=* which triggers RETURNING/SELECT behavior
  implication: The SELECT-back of the inserted row is what triggers the recursive policy. Without .select(), the INSERT would succeed.

- timestamp: 2026-03-20T00:03:00Z
  checked: other RLS policies for similar self-referential patterns
  found: artist_members_select (line 196-200) also queries community_members — not self-referential but cross-table. community_members_select is the only self-referential policy.
  implication: Only community_members INSERT+SELECT triggers the recursion

## Resolution

root_cause: |
  The community_members_select RLS policy in the initial schema migration is self-referential:
  it queries community_members FROM WITHIN the community_members RLS policy.
  When useJoinCommunity calls .insert({...}).select().single(), PostgREST sends
  POST /community_members?select=* (Prefer: return=representation), which performs
  an INSERT then SELECTs back the row. The SELECT triggers the community_members_select
  policy, which runs "SELECT 1 FROM community_members cm WHERE cm.community_id = ...".
  That subquery accesses community_members again, triggering the policy again →
  infinite recursion → PostgreSQL stack overflow → PostgREST returns 500.

fix: |
  New migration 20260320000002_fix_community_members_rls.sql:
  1. Creates get_my_community_ids() SECURITY DEFINER function that returns community_ids
     for the current user by querying community_members with RLS bypassed.
  2. Drops the old recursive community_members_select policy.
  3. Recreates the policy using get_my_community_ids() — non-recursive because
     the SECURITY DEFINER function bypasses RLS when it queries community_members.
  The policy behavior is semantically identical: users can see all member rows
  for communities they belong to.

verification: |
  Migration 20260320000002_fix_community_members_rls.sql successfully applied to
  pvhpchindstbzurgybni (wecord-wv) remote Supabase instance.
  Also confirmed migration 20260320000001_phase3_triggers_storage.sql was applied
  in the same push (triggers had not been applied yet — DROP IF EXISTS NOTICEs confirm this).
  Awaiting human verification that community join no longer returns 500.
files_changed:
  - packages/supabase/migrations/20260320000002_fix_community_members_rls.sql
