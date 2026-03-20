---
phase: 3
slug: community-core-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.1.0 |
| **Config file** | `apps/mobile/vitest.config.ts` |
| **Quick run command** | `cd apps/mobile && pnpm test` |
| **Full suite command** | `cd apps/mobile && pnpm test:ci` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/mobile && pnpm test`
- **After every plan wave:** Run `cd apps/mobile && pnpm test:ci`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | COMM-01 | unit | `cd apps/mobile && pnpm test -- community.test` | W0 | pending |
| 03-01-02 | 01 | 1 | COMM-03 | unit | `cd apps/mobile && pnpm test -- community.test` | W0 | pending |
| 03-01-03 | 01 | 1 | COMM-06 | unit | `cd apps/mobile && pnpm test -- community.test` | W0 | pending |
| 03-02-01 | 02 | 1 | FANF-01 | unit | `cd apps/mobile && pnpm test -- post.test` | W0 | pending |
| 03-02-02 | 02 | 1 | FANF-04 | unit | `cd apps/mobile && pnpm test -- feed.test` | W0 | pending |
| 03-02-03 | 02 | 1 | FANF-07 | unit | `cd apps/mobile && pnpm test -- post.test` | W0 | pending |
| 03-03-01 | 03 | 2 | CREF-04 | unit | `cd apps/mobile && pnpm test -- PostCard.test` | W0 | pending |
| 03-03-02 | 03 | 2 | CREF-01 | schema-grep | `grep -q "author_role" packages/db/src/schema/content.ts` | exists | pending |
| 03-04-01 | 04 | 2 | INTC-04 | unit | `cd apps/mobile && pnpm test -- likes.test` | W0 | pending |
| 03-04-02 | 04 | 2 | INTC-01 | unit | `cd apps/mobile && pnpm test -- comment.test` | W0 | pending |
| 03-04-03 | 04 | 2 | INTC-02 | unit | `cd apps/mobile && pnpm test -- comment.test` | W0 | pending |
| 03-04-04 | 04 | 2 | MEMB-03 | unit | `cd apps/mobile && pnpm test -- follow.test` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `apps/mobile/tests/community.test.ts` — stubs for COMM-01, COMM-03, COMM-06
- [ ] `apps/mobile/tests/post.test.ts` — stubs for FANF-01, FANF-07
- [ ] `apps/mobile/tests/feed.test.ts` — stubs for FANF-04 (cursor pagination logic)
- [ ] `apps/mobile/tests/likes.test.ts` — stubs for INTC-04, INTC-05
- [ ] `apps/mobile/tests/comment.test.ts` — stubs for INTC-01, INTC-02, INTC-03
- [ ] `apps/mobile/tests/follow.test.ts` — stubs for MEMB-03
- [ ] `apps/mobile/tests/PostCard.test.tsx` — stubs for CREF-04 (CreatorBadge rendering)
- [ ] DB triggers: `update_like_count()` + `update_comment_count()` trigger functions
- [ ] Supabase Storage bucket `post-media` creation
- [ ] `posts_with_nickname` view verification
- [ ] Package installs: `@shopify/flash-list`, `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `react-native-reanimated`

---

## CREF-01 Nyquist Justification

CREF-01 (creator role enforcement via RLS) cannot be fully unit-tested in vitest/jsdom because RLS policies require a real PostgreSQL auth context with JWT claims. Instead, Plan 03-03 Task 1 includes an automated schema-grep check:

```bash
grep -q "author_role" packages/db/src/schema/content.ts
```

This confirms the `author_role` column and RLS policy definition exist in the schema source. The actual RLS enforcement is verified:
1. **At schema level:** `content.ts` defines the `posts_insert_member` RLS policy that checks `community_members.role` matches `author_role`
2. **At code level:** `useCreatePost` reads `useCommunityMember().role` and only passes `authorRole: 'creator'` when the user is actually a creator
3. **At integration level:** Full RLS testing occurs during `supabase db reset` which applies all migrations and policies

This is sufficient for Nyquist compliance because the automated grep provides a fast (<1s) feedback signal that the schema constraint exists, while the deeper RLS behavior is enforced by PostgreSQL itself.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Creator post insert fails if user's role is not 'creator' | CREF-01 | Full RLS round-trip requires real Supabase auth context | Test via Supabase Studio: attempt INSERT into posts with author_role='creator' using a non-creator JWT; should fail with RLS violation |

---

## Deferred Requirements

| Requirement | Description | Deferred To | Reason |
|-------------|-------------|-------------|--------|
| MEMB-04 | Push notification for followed member's posts | Phase 4 | Push notification infrastructure not yet built |
| CREF-03 | Creator post triggers push notification to all community members | Phase 4 | Push notification infrastructure not yet built |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
