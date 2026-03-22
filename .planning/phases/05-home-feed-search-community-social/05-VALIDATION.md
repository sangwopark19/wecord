---
phase: 5
slug: home-feed-search-community-social
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already configured in repo) |
| **Config file** | `apps/mobile/vitest.config.ts` |
| **Quick run command** | `pnpm --filter mobile test --run` |
| **Full suite command** | `pnpm --filter mobile test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter mobile test --run`
- **After every plan wave:** Run `pnpm --filter mobile test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HOME-01 | unit | `pnpm --filter mobile test --run tests/useHomeFeed.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | HOME-02 | unit | `pnpm --filter mobile test --run tests/useHomeFeed.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | HOME-03 | unit | `pnpm --filter mobile test --run tests/feed.test.ts` | ✅ | ⬜ pending |
| 05-01-04 | 01 | 1 | HOME-04 | unit | `pnpm --filter mobile test --run` | ✅ | ⬜ pending |
| 05-01-05 | 01 | 1 | HOME-05 | unit | `pnpm --filter mobile test --run tests/usePromotionBanners.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | SRCH-01 | manual | manual | n/a | ⬜ pending |
| 05-02-02 | 02 | 2 | SRCH-02 | unit | `pnpm --filter mobile test --run tests/usePostSearch.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | SRCH-03 | unit | `pnpm --filter mobile test --run tests/usePostSearch.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 2 | FLLW-01 | unit | `pnpm --filter mobile test --run tests/follow.test.ts` | ✅ | ⬜ pending |
| 05-02-05 | 02 | 2 | FLLW-02 | unit | `pnpm --filter mobile test --run tests/useCommunityProfile.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-06 | 02 | 2 | FLLW-03 | unit | `pnpm --filter mobile test --run tests/useCommunityProfile.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-07 | 02 | 2 | FLLW-04 | unit | `pnpm --filter mobile test --run tests/follow.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/mobile/tests/useHomeFeed.test.ts` — stubs for HOME-01, HOME-02
- [ ] `apps/mobile/tests/usePromotionBanners.test.ts` — stubs for HOME-05
- [ ] `apps/mobile/tests/usePostSearch.test.ts` — stubs for SRCH-02, SRCH-03
- [ ] `apps/mobile/tests/useCommunityProfile.test.ts` — stubs for FLLW-02, FLLW-03
- [ ] `packages/supabase/migrations/20260322000000_phase5_promotion_banners.sql` — required before banner queries

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HomeSearchBar tap navigates to search screen | SRCH-01 | Navigation behavior requires runtime | 1. Open home screen 2. Tap search bar 3. Verify search screen opens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
