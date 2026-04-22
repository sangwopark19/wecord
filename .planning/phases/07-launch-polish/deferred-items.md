# Phase 7 Deferred Items

Out-of-scope discoveries surfaced during 07-01 execution.

| Item | Owner | Notes |
|------|-------|-------|
| `apps/mobile/eslint.config.js` (or migration from legacy `.eslintrc`) | infra | ESLint v9 requires a flat config. `pnpm lint` errors before any rules run on both worktree AND main repo. Pre-existing — no PRs in 07-01 introduced this. Suggested fix: add minimal `eslint.config.js` extending @react-native config. |
| `apps/admin/README.md` and other untracked admin assets | unrelated | Pre-existing untracked files in repo root (favicon.ico, public/, package-lock.json under apps/admin) — not related to 07-01. |
| Wave 0 stub completion flag in `.planning/phases/07-launch-polish/07-VALIDATION.md` (`wave_0_complete`) | 07-02 | 07-01 contributes 7 stubs (4 promoted to real tests). 07-02 adds shop/dm/account stubs. Flip flag once both done. |
