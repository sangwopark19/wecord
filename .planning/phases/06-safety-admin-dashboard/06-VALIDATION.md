---
phase: 6
slug: safety-admin-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / vitest |
| **Config file** | apps/admin/vitest.config.ts, apps/mobile/jest.config.js |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SAFE-01 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | SAFE-02 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | SAFE-03 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | SAFE-04 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 1 | SAFE-05 | unit | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-01-06 | 01 | 1 | SAFE-06 | unit | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ADMN-05 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | ADMN-06 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | ADMN-07 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-02-04 | 02 | 2 | ADMN-08 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | ADMN-01 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | ADMN-02 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-03 | 03 | 2 | ADMN-03 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-04 | 03 | 2 | ADMN-04 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-05 | 03 | 2 | ADMN-09 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-06 | 03 | 2 | ADMN-10 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 06-03-07 | 03 | 2 | ADMN-11 | integration | `npm run typecheck` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Typecheck passes for admin and mobile apps
- [ ] Lint passes for admin and mobile apps

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Report bottom sheet UX | SAFE-01 | Visual/interaction | Open post menu → tap Report → verify bottom sheet with 5 reasons |
| Toast feedback | SAFE-03 | Visual | Submit report → verify toast appears |
| Admin sidebar navigation | ADMN-01 | Visual/layout | Login as admin → verify 8 menu items in sidebar |
| Analytics charts | ADMN-09 | Visual | Navigate to Analytics → verify line charts render with date presets |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
