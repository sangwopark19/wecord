---
quick_id: 260422-m4b
description: fix PR CI pnpm version conflict
status: complete
branch: feat/wecord-variation-a-home-rails
commit: 51a42f5
completed: 2026-04-22
---

# Quick Task 260422-m4b Summary: Fix PR CI pnpm version conflict

## One-liner

Removed `with: version: 9` from all 4 `pnpm/action-setup@v4` uses in `.github/workflows/ci.yml` so the action reads the pinned `pnpm@9.15.0` version from root `package.json` `packageManager` field, resolving the `ERR_PNPM_BAD_PM_VERSION`-style "Multiple versions of pnpm specified" CI failure on PR #1.

## Problem

PR #1 CI `Lint & Typecheck` job was failing at the `pnpm/action-setup@v4` step:

```
Error: Multiple versions of pnpm specified:
  - version 9 in the GitHub Action config with the key "version"
  - version pnpm@9.15.0 in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

Downstream jobs (`Build`, `Test`, `Supabase Migration Test`, `EAS Build`) all depend on `lint-typecheck` via `needs:`, so they skipped and the PR was unmergeable.

## Fix

Deleted the `with: / version: 9` block from each of the 4 `pnpm/action-setup@v4` step uses in `.github/workflows/ci.yml`:

- `lint-typecheck` job (was lines 16-18)
- `build` job (was lines 41-43)
- `test` job (was lines 100-102)
- `eas-build` job (was lines 123-125)

No other steps touched. Scope strictly limited to the pnpm conflict.

## Verification

Ran the plan's two required grep checks after editing:

```
$ grep -c "version: 9" .github/workflows/ci.yml
0

$ grep -c "pnpm/action-setup@v4" .github/workflows/ci.yml
4
```

Both match the plan's required outputs exactly:
- `version: 9` count: **0** (required: 0) — all conflicting overrides removed
- `pnpm/action-setup@v4` count: **4** (required: 4) — all 4 step uses still present, just without `with.version`

Git commit diff confirms: `1 file changed, 8 deletions(-)` (4 x 2-line `with:` blocks removed, which equals the 8 deleted lines).

## Files Modified

- `.github/workflows/ci.yml` — 8 lines deleted across 4 step uses

## Commit

- `51a42f5` — `fix(ci): remove version: 9 from pnpm/action-setup to match packageManager in package.json`

## Deviations

None — executed exactly as planned.

## Self-Check: PASSED

- `.github/workflows/ci.yml` edit present in commit `51a42f5`
- `grep -c "version: 9" .github/workflows/ci.yml` = 0
- `grep -c "pnpm/action-setup@v4" .github/workflows/ci.yml` = 4
- Commit landed on `feat/wecord-variation-a-home-rails` (not on a worktree / not on main)
- No Co-Authored-By trailer in commit message
