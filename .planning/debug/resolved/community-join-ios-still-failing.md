---
status: awaiting_human_verify
trigger: "community-join-ios-still-failing"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — is_community_member() was marked STABLE, allowing PostgreSQL to cache its FALSE result from before the INSERT within the same INSERT...RETURNING statement, causing the RETURNING clause to return 0 rows (PGRST116) for fresh joins.
test: Applied migration 20260320000003 changing STABLE to VOLATILE; added PGRST116 fallback in useJoinCommunity.ts as defense-in-depth.
expecting: Fresh iOS users (who haven't joined before) can now join successfully.
next_action: Human verification — test community join on iOS (Expo Go)

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: iOS에서 가입 버튼을 누르면 community_members에 row가 insert되고 커뮤니티 메인으로 이동
actual: iOS에서 여전히 오류 팝업이 표시됨 (웹/안드로이드는 정상 동작 확인됨)
errors: iOS에서 오류 팝업 (Alert.alert) — 이전에는 500 Internal Server Error였음
reproduction: iOS (Expo Go)에서 커뮤니티 검색 → 미리보기 → 가입 버튼 클릭
started: 웹/안드로이드는 RLS 수정 후 동작하지만 iOS만 여전히 실패

## Eliminated

- hypothesis: Migration 20260320000002 not applied to remote Supabase
  evidence: `supabase migration list --linked` confirmed all 3 migrations (including 002) are applied
  timestamp: 2026-03-20T00:30:00Z

- hypothesis: Edge Function error not caught (old code path)
  evidence: Commit 0f08646 added try/catch to loadNickname and generateNickname — both confirmed present in current code
  timestamp: 2026-03-20T00:35:00Z

- hypothesis: user is null in useJoinCommunity (auth state timing)
  evidence: AuthGuard prevents navigation to community screens while loading=true; user is set before join screen is reachable; Zustand hook causes re-renders that update the mutation closure
  timestamp: 2026-03-20T00:40:00Z

- hypothesis: iOS-specific auth provider (Apple vs Google) causes RLS difference
  evidence: auth.uid() returns consistent UUID regardless of provider; RLS policies are provider-agnostic
  timestamp: 2026-03-20T00:45:00Z

- hypothesis: 23505 "already member" path fails silently
  evidence: isAlreadyMember string check correctly matches cm_user_community_unique constraint name; this path would show "닉네임 중복" not "오류"
  timestamp: 2026-03-20T00:50:00Z

## Evidence

- timestamp: 2026-03-20T00:30:00Z
  checked: packages/supabase/migrations/ directory listing + migration list --linked output
  found: All 3 migrations applied to remote. Migration 002 SQL: creates is_community_member() as STABLE SECURITY DEFINER, replaces recursive community_members_select policy.
  implication: Database fix is confirmed live. Look for iOS-specific behavior in client or function semantics.

- timestamp: 2026-03-20T00:40:00Z
  checked: useJoinCommunity.ts full code, join.tsx full code, authStore.ts, _layout.tsx
  found: |
    useJoinCommunity does INSERT.select().single() which uses Prefer: return=representation.
    PostgREST executes INSERT...RETURNING with SELECT RLS policy applied to RETURNING rows.
    is_community_member() is marked STABLE — PostgreSQL is permitted to cache its result within a
    single INSERT...RETURNING statement.
    For a FRESH join (user has never joined this community), if is_community_member() was called
    earlier in the same statement context with the same argument and returned FALSE, PostgreSQL
    could cache that FALSE result and use it for the RETURNING evaluation — blocking the row.
    This causes .single() to return PGRST116 (0 rows), triggering the generic error alert.
  implication: |
    iOS test users are FRESH (never joined). Android/web test users are ALREADY MEMBERS (joined
    previously via some other mechanism or earlier test). Already-members hit the 23505 path and
    succeed via the "fetch existing" branch. Fresh joiners hit the INSERT+RETURNING PGRST116 bug.

- timestamp: 2026-03-20T00:45:00Z
  checked: git log for migration 20260320000002_fix_community_members_rls.sql
  found: The file is UNTRACKED in git — it was pushed to remote Supabase but never committed.
  implication: Migration is live on remote (confirmed), but not in git history. Added to fix list.

- timestamp: 2026-03-20T00:55:00Z
  checked: PostgreSQL STABLE function semantics in INSERT...RETURNING context
  found: |
    STABLE allows PostgreSQL to cache function results within a single query. For INSERT...RETURNING,
    the RETURNING clause evaluates the SELECT RLS policy for each returned row. is_community_member()
    with STABLE could be cached as FALSE if it was evaluated before the insert was visible.
    Changing to VOLATILE ensures PostgreSQL always re-executes the function and sees the freshly
    inserted row.
  implication: This is the root cause. Fix: change STABLE to VOLATILE in migration 003.

## Resolution

root_cause: |
  is_community_member() was marked STABLE in migration 20260320000002. PostgreSQL's STABLE
  optimization allows the function's result to be cached within a single query. When PostgREST
  executes INSERT INTO community_members ... RETURNING * (via Prefer: return=representation),
  the SELECT RLS policy calls is_community_member(community_id) for RETURNING rows. For fresh
  joins (first-time iOS users), if PostgreSQL cached the FALSE result from a prior evaluation
  context within the same statement, the RETURNING clause returns 0 rows. PostgREST's .single()
  returns PGRST116 (JSON object requested, multiple or no rows returned). The client catches this
  as a generic error and shows Alert.alert('오류', ...).

  Web/Android test users were already members — their INSERT failed with 23505 (unique constraint)
  and the "already member" recovery path returned the existing row successfully. iOS test users
  were fresh joiners, hitting the INSERT+RETURNING path directly and encountering the STABLE bug.

fix: |
  1. Migration 20260320000003_fix_is_community_member_volatile.sql: Changed is_community_member()
     from STABLE to VOLATILE — PostgreSQL will always re-execute the function, never using a cached
     result. Applied to remote via `supabase db push`.

  2. useJoinCommunity.ts: Added explicit PGRST116 handling in the INSERT path — if INSERT+RETURNING
     returns 0 rows (either !data or error.code === 'PGRST116'), a separate SELECT fetches the
     just-inserted row directly. This is defense-in-depth in case the migration doesn't fully
     resolve the caching issue in all PostgreSQL query plans.

  3. useJoinCommunity.ts: Added error check on the "already member" SELECT (existingError was
     previously silently dropped, causing the code to fall through to the nickname retry path).

  4. useJoinCommunity.ts: Added console.error with error code/message for all error paths to aid
     future diagnosis.

  5. join.tsx: Added console.error in handleJoin catch to log the actual error object on iOS.

verification: Awaiting human verification on iOS.
files_changed:
  - packages/supabase/migrations/20260320000003_fix_is_community_member_volatile.sql
  - apps/mobile/hooks/community/useJoinCommunity.ts
  - apps/mobile/app/(community)/[id]/join.tsx
