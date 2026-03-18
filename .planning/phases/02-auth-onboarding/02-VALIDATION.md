---
phase: 2
slug: auth-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (to be installed in Wave 0) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pnpm --filter mobile test` |
| **Full suite command** | `pnpm --filter mobile test:ci` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter mobile test`
- **After every plan wave:** Run `pnpm --filter mobile test:ci`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-04 | unit | `pnpm --filter mobile test tests/supabase.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | manual-only | Manual: iOS/Android simulator OAuth | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-02 | manual-only | Manual: physical iOS device | N/A | ⬜ pending |
| 02-01-04 | 01 | 1 | AUTH-03 | integration | `pnpm --filter mobile test tests/profile.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | AUTH-05 | unit | `pnpm --filter mobile test tests/onboarding.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | AUTH-08 | unit | `pnpm --filter mobile test tests/onboarding.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | AUTH-07 | unit | `pnpm --filter mobile test tests/onboarding.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | AUTH-06 | integration | `pnpm --filter mobile test tests/curate.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 2 | AUTH-09 | db smoke | `supabase db diff` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/mobile/vitest.config.ts` — vitest config with jsdom + RN preset
- [ ] `apps/mobile/tests/setup.ts` — test environment + Supabase mock
- [ ] `apps/mobile/tests/supabase.test.ts` — covers AUTH-04 (SecureStore adapter)
- [ ] `apps/mobile/tests/profile.test.ts` — covers AUTH-03
- [ ] `apps/mobile/tests/onboarding.test.ts` — covers AUTH-05, AUTH-07, AUTH-08
- [ ] `apps/mobile/tests/curate.test.ts` — covers AUTH-06
- [ ] Test framework install: `pnpm --filter mobile add -D vitest @testing-library/react-native`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth sign-in triggers Supabase signInWithOAuth and opens WebBrowser | AUTH-01 | Requires real browser redirect + system OAuth flow | 1. Launch app on simulator 2. Tap "Google로 로그인" 3. Complete Google consent 4. Verify callback returns to app and session exists |
| Apple OAuth sign-in triggers signInWithIdToken on iOS | AUTH-02 | Requires physical iOS device with Apple ID | 1. Launch on physical iOS device 2. Tap "Apple로 로그인" 3. Complete Face ID/Touch ID 4. Verify callback returns and session exists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
