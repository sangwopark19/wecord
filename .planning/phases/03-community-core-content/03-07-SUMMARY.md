---
phase: 03-community-core-content
plan: 07
subsystem: community-join
tags: [join-flow, error-handling, navigation, membership]
dependency_graph:
  requires: []
  provides: [working-join-flow, membership-aware-navigation]
  affects: [community-card, join-screen, join-mutation]
tech_stack:
  added: []
  patterns: [defensive-async-catch, constraint-disambiguation, reactive-routing]
key_files:
  created: []
  modified:
    - apps/mobile/app/(community)/[id]/join.tsx
    - apps/mobile/hooks/community/useJoinCommunity.ts
    - apps/mobile/components/community/CommunityCard.tsx
decisions:
  - "generateNickname wraps entire supabase.functions.invoke in try/catch — handles thrown network errors not covered by supabase-js error return"
  - "23505 handler checks error.message/details for cm_user_community to distinguish already-member from nickname collision"
  - "CommunityCard membership routing uses same queryKey as join mutation invalidation — cache coherence is automatic"
metrics:
  duration_seconds: 103
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_modified: 3
requirements: [MEMB-01, MEMB-02, COMM-01]
---

# Phase 03 Plan 07: Community Join Flow Fix Summary

**One-liner:** Defensive error handling for nickname generation plus membership-aware routing in CommunityCard for direct community entry.

## What Was Built

Fixed a blocker-severity issue: nickname generation was crashing on iOS (unhandled promise rejection) and silently failing on web/Android. 13 of 17 UAT tests were skipped because users could not enter any community.

Two changes were applied:

1. **Join flow error hardening** — `generateNickname` now wraps the entire `supabase.functions.invoke` call in a `try/catch`. The existing `if (error || !data?.nickname)` check only handled clean supabase-js error returns; thrown exceptions from network failures were uncaught. The `loadNickname` useEffect in `join.tsx` also gained a `catch` block with a local `User#XXXX` fallback so the join button is never stuck disabled due to an empty nickname.

2. **Membership-aware CommunityCard navigation** — `CommunityCard` now calls `useCommunityMember(community.id)`. On press, members are routed to `/(community)/[id]` (community main) directly; non-members still go to `/(community)/[id]/preview`. The query key `['communityMember', communityId]` is the same key invalidated by the join mutation, so after joining and returning to search, the next tap correctly navigates to community main.

3. **23505 constraint disambiguation** — The already-member unique constraint (`cm_user_community`) is distinguished from nickname collision by checking `error.message`/`error.details` for the constraint name. Already-joined re-join attempts fetch and return the existing membership row instead of throwing.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 0f08646 | fix(03-07): fix join flow error handling and constraint detection |
| 2    | ad3f652 | feat(03-07): add membership-aware navigation to CommunityCard |

## Deviations from Plan

None — plan executed exactly as written. The 03-06 image fallback changes to CommunityCard were preserved as the plan instructed.

## Self-Check: PASSED

All key files verified present. Both task commits (0f08646, ad3f652) confirmed in git log.
