---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `packages/db/vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `pnpm --filter @wecord/db test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @wecord/db test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUN-01 | integration | `pnpm dev` exits 0 | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | FOUN-02 | unit | `pnpm --filter @wecord/db test` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | FOUN-03 | unit | `pnpm --filter @wecord/db test` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | FOUN-04 | integration | `supabase db push --local` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | FOUN-05 | integration | `npx expo export --platform ios` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | FOUN-06 | integration | `pnpm --filter admin build` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 2 | FOUN-07 | unit | `pnpm --filter @wecord/shared test` | ❌ W0 | ⬜ pending |
| 01-03-04 | 03 | 2 | FOUN-08 | integration | `eas build --platform all --profile preview` | ❌ W0 | ⬜ pending |
| 01-03-05 | 03 | 2 | FOUN-09 | integration | GitHub Actions workflow runs | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/db/vitest.config.ts` — vitest config for DB package
- [ ] `packages/db/src/__tests__/schema.test.ts` — stubs for FOUN-02, FOUN-03
- [ ] `packages/shared/vitest.config.ts` — vitest config for shared package
- [ ] `vitest` + `@vitest/coverage-v8` — install in workspace root

*Wave 0 sets up test infrastructure before functional tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark theme visual check | FOUN-05 | Visual appearance needs human eye | Open app, verify #000000 background and #00E5C3 accent |
| EAS Build registration | FOUN-08 | External service state | Run `eas project:info` and verify project ID |
| Cloudflare Pages deploy | FOUN-06 | External service state | Open Cloudflare dashboard, verify deployment success |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
