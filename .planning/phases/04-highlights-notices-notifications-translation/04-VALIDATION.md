---
phase: 4
slug: highlights-notices-notifications-translation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-20
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already configured in mobile — Phase 2) |
| **Config file** | `apps/mobile/vitest.config.ts` |
| **Quick run command** | `pnpm --filter mobile test --run` |
| **Full suite command** | `pnpm --filter mobile test --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter mobile test --run`
- **After every plan wave:** Run `pnpm --filter mobile test --run --coverage && pnpm --filter mobile typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-00-01 | 00 | 0 | Wave 0 stubs | scaffold | `pnpm --filter mobile test --run` | Created in W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | HIGH-01~05 | unit | `pnpm --filter mobile test --run useHighlight` | ✅ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | NOTC-01~05 | unit | `pnpm --filter mobile test --run useNotices` | ✅ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | NOTF-06~07 | unit | `pnpm --filter mobile test --run useNotifications` | ✅ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | NOTF-08 | unit | `pnpm --filter mobile test --run useUnreadNotificationCount` | ✅ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | TRAN-01~03 | unit | `pnpm --filter mobile test --run useTranslate` | ✅ W0 | ⬜ pending |
| 04-04-02 | 04 | 2 | TRAN-04 | unit | `pnpm --filter mobile test --run useTranslate` | ✅ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | NOTF-01~05 | manual-only | Manual: create post → check device notification | — | ⬜ pending |
| 04-02-02 | 02 | 1 | NOTC-03 | manual-only | Manual: set scheduled_at 2 min future → verify publish | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `apps/mobile/tests/useHighlight.test.ts` — stubs for HIGH-01~05 (created by 04-00-PLAN)
- [x] `apps/mobile/tests/useNotifications.test.ts` — stubs for NOTF-06~07 (created by 04-00-PLAN)
- [x] `apps/mobile/tests/useUnreadNotificationCount.test.ts` — stubs for NOTF-08 (created by 04-00-PLAN)
- [x] `apps/mobile/tests/useNotices.test.ts` — stubs for NOTC-05 (created by 04-00-PLAN)
- [x] `apps/mobile/tests/useTranslate.test.ts` — stubs for TRAN-01~04 (created by 04-00-PLAN)
- [x] Framework install: already configured — no new install needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push notifications delivered via Expo Push API | NOTF-01~05 | Requires physical device with Expo push token; simulator cannot receive push | 1. Create post as creator 2. Check device notification tray 3. Verify notification appears |
| pg_cron scheduled notice publish | NOTC-03 | Requires pg_cron running in DB; timing-dependent | 1. Create notice with scheduled_at = NOW()+2min 2. Wait 2 minutes 3. Verify published_at is set and notification sent |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
