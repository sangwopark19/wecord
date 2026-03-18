---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [turborepo, pnpm, monorepo, drizzle-orm, vitest, typescript, eslint, prettier]

# Dependency graph
requires: []
provides:
  - Turborepo 2.8.17 + pnpm workspace monorepo root with full task pipeline
  - packages/db stub (@wecord/db) with drizzle-orm + drizzle-kit wired
  - packages/shared stub (@wecord/shared) with i18next + react-i18next wired
  - packages/supabase placeholder for Supabase CLI init (Plan 01-02)
  - tooling/typescript with base/expo/nextjs tsconfig presets
  - tooling/eslint and tooling/prettier shared configs
  - Vitest configs and todo stubs for FOUN-03/04 (db) and FOUN-08 (shared)
affects: [01-02, 01-03, 01-04, all subsequent plans]

# Tech tracking
tech-stack:
  added:
    - turbo 2.8.17
    - pnpm 9.15.0 (workspace)
    - drizzle-orm ^0.45.1
    - drizzle-kit ^0.31.10
    - postgres ^3.4.5
    - i18next ^25.8.18
    - react-i18next ^16.5.8
    - vitest ^3.1.0
    - typescript ^5.7.0
  patterns:
    - Turborepo task pipeline with dependsOn and persistent dev cache
    - pnpm workspace protocol (workspace:*) for internal package references
    - Shared tsconfig via tooling/typescript/base.json extending pattern
    - Vitest todo stubs as test scaffolding before implementation

key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - .npmrc
    - .gitignore
    - packages/db/package.json
    - packages/db/tsconfig.json
    - packages/db/src/index.ts
    - packages/db/vitest.config.ts
    - packages/db/src/__tests__/schema.test.ts
    - packages/supabase/package.json
    - packages/shared/package.json
    - packages/shared/tsconfig.json
    - packages/shared/src/index.ts
    - packages/shared/vitest.config.ts
    - packages/shared/src/__tests__/i18n.test.ts
    - tooling/typescript/package.json
    - tooling/typescript/base.json
    - tooling/typescript/expo.json
    - tooling/typescript/nextjs.json
    - tooling/eslint/package.json
    - tooling/eslint/base.js
    - tooling/prettier/package.json
    - tooling/prettier/index.js
  modified: []

key-decisions:
  - "Vitest 3.1.x chosen as test framework (per RESEARCH.md); todo stubs scaffold test structure before schema implementation"
  - "tooling/typescript package named @wecord/typescript-config to match workspace:* protocol in db/shared devDependencies"
  - "packages/supabase kept minimal (no build scripts) since Supabase CLI manages the environment, not pnpm"

patterns-established:
  - "Pattern: All internal package imports use workspace:* protocol in devDependencies"
  - "Pattern: Each package extends tooling/typescript/base.json for consistent TS settings"
  - "Pattern: Vitest todo stubs placed in src/__tests__/ before implementation plans run"

requirements-completed:
  - FOUN-01
  - FOUN-03
  - FOUN-04
  - FOUN-08

# Metrics
duration: 10min
completed: 2026-03-18
---

# Phase 01 Plan 01: Foundation Summary

**Turborepo 2.8.17 + pnpm monorepo scaffold with @wecord/db (drizzle-orm), @wecord/shared (i18next), shared TypeScript/ESLint/Prettier tooling, and vitest todo stubs for schema and i18n tests**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-18T05:05:30Z
- **Completed:** 2026-03-18T05:15:00Z
- **Tasks:** 3
- **Files modified:** 24 created

## Accomplishments

- Monorepo root configured with Turborepo 2.8.17, pnpm workspace, and full task pipeline (build/dev/lint/typecheck/test/clean)
- Three workspace packages created: @wecord/db (Drizzle ORM ready), @wecord/shared (i18next ready), @wecord/supabase (placeholder)
- Shared tooling established: TypeScript presets for base/expo/nextjs, ESLint with TypeScript parser, Prettier with project conventions
- Vitest configs and todo test stubs placed for FOUN-03/04 (schema/RLS) and FOUN-08 (i18n) — both run with 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize monorepo root and workspace configuration** - `f1656ac` (chore)
2. **Task 2: Create workspace packages and shared tooling** - `c8362e1` (chore)
3. **Task 3: Create vitest configs and test stubs** - `1c6cf1e` (test)

## Files Created/Modified

- `package.json` - Root monorepo config with turbo scripts and pnpm@9.15.0
- `pnpm-workspace.yaml` - Workspace globs: apps/*, packages/*, tooling/*
- `turbo.json` - Task pipeline with build/dev/lint/typecheck/test/clean
- `.npmrc` - auto-install-peers=true, strict-peer-dependencies=false
- `.gitignore` - Standard monorepo ignores
- `packages/db/package.json` - @wecord/db with drizzle-orm, postgres, drizzle-kit
- `packages/db/tsconfig.json` - Extends tooling/typescript/base.json
- `packages/db/src/index.ts` - Empty stub (schema in Plan 01-02)
- `packages/db/vitest.config.ts` - Vitest node environment config
- `packages/db/src/__tests__/schema.test.ts` - FOUN-03/04 todo stubs
- `packages/supabase/package.json` - @wecord/supabase minimal placeholder
- `packages/shared/package.json` - @wecord/shared with i18next, react-i18next
- `packages/shared/tsconfig.json` - Extends tooling/typescript/base.json
- `packages/shared/src/index.ts` - Empty stub (i18n in Plan 01-03)
- `packages/shared/vitest.config.ts` - Vitest node environment config
- `packages/shared/src/__tests__/i18n.test.ts` - FOUN-08 todo stubs
- `tooling/typescript/package.json` - @wecord/typescript-config package
- `tooling/typescript/base.json` - ES2022 + strict + bundler moduleResolution
- `tooling/typescript/expo.json` - Extends base with jsx: react-jsx
- `tooling/typescript/nextjs.json` - Extends base with jsx: preserve + next plugin
- `tooling/eslint/package.json` - @wecord/eslint-config package
- `tooling/eslint/base.js` - TypeScript parser + @typescript-eslint rules
- `tooling/prettier/package.json` - @wecord/prettier-config package
- `tooling/prettier/index.js` - singleQuote, trailingComma all, printWidth 100

## Decisions Made

- Used `@wecord/typescript-config` as the package name (not `@wecord/tsconfig`) to match the `workspace:*` reference already specified in the plan's package.json examples.
- Kept packages/supabase/package.json minimal with no build scripts — Supabase CLI (`supabase init`, `supabase start`) manages this directory, not pnpm.
- Added vitest to workspace root devDependencies in addition to package-level declarations to ensure the binary is available globally.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Monorepo foundation complete — Plan 01-02 can immediately begin Drizzle schema definition in packages/db
- packages/supabase/ is ready for `supabase init` in Plan 01-02
- packages/shared/ is ready for i18n scaffold in Plan 01-03
- Vitest todo stubs are in place; Plans 01-02 and 01-03 will fill them in

---
*Phase: 01-foundation*
*Completed: 2026-03-18*
