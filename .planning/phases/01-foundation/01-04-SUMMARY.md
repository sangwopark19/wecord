---
phase: 01-foundation
plan: "04"
subsystem: infra
tags: [nextjs, cloudflare, opennextjs, shadcn, tailwind, eas, github-actions, ci-cd]

# Dependency graph
requires:
  - phase: 01-01
    provides: monorepo scaffold with pnpm workspace, turbo.json, @wecord/typescript-config

provides:
  - Next.js 16 admin app at apps/admin with @opennextjs/cloudflare adapter configured
  - shadcn/ui initialized with dark theme matching UI-SPEC CSS variables
  - wrangler.jsonc and open-next.config.ts for Cloudflare Workers deployment
  - EAS Build configured with dev/preview/production profiles (projectId registered)
  - GitHub Actions CI pipeline with lint-typecheck, build, test, migration-test, eas-build jobs

affects: [06-admin, deploy, ci]

# Tech tracking
tech-stack:
  added:
    - "@opennextjs/cloudflare@^1.17.1 — Next.js to Cloudflare Workers adapter"
    - "wrangler@^4.75.0 — Cloudflare Workers deployment CLI"
    - "clsx, tailwind-merge, class-variance-authority — shadcn/ui utilities"
    - "lucide-react — icon library for admin"
    - "eas-cli@18.4.0 — EAS Build/Update CLI (CI usage)"
  patterns:
    - "defineCloudflareConfig in open-next.config.ts (NOT deprecated defineConfig)"
    - "initOpenNextCloudflareForDev() in next.config.ts for dev environment"
    - "html className='dark' for dark-first theming (not prefers-color-scheme)"
    - "HSL CSS variables in globals.css for shadcn/ui token system"
    - "EAS Build only triggers on refs/tags/v* (release tags) to save costs"

key-files:
  created:
    - apps/admin/open-next.config.ts
    - apps/admin/wrangler.jsonc
    - apps/admin/components.json
    - apps/admin/app/globals.css
    - apps/admin/app/layout.tsx
    - apps/admin/app/page.tsx
    - apps/admin/postcss.config.mjs
    - apps/mobile/eas.json
    - .github/workflows/ci.yml
  modified:
    - apps/admin/package.json
    - apps/admin/tsconfig.json
    - apps/admin/next.config.ts
    - apps/mobile/package.json
    - apps/mobile/app.json

key-decisions:
  - "Use defineCloudflareConfig (not defineConfig) — @opennextjs/cloudflare v1.x exports this name"
  - "shadcn init with --defaults failed due to npm/pnpm workspace conflict; dependencies installed manually via pnpm"
  - "EAS project registered as @sangwopark19icons/wecord (ID: 4f63285c-d678-4309-84e8-43e9897eb820)"
  - "CI migration-test uses supabase/setup-cli@v1 action with -x flags to skip unused services (faster)"

patterns-established:
  - "Pattern: Next.js admin app uses @opennextjs/cloudflare, never next-on-pages"
  - "Pattern: Dark theme applied via html className='dark' (not media query)"
  - "Pattern: CI lint-typecheck is the gate; build/test/migration-test are parallel after it"

requirements-completed:
  - FOUN-07
  - FOUN-09

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 01 Plan 04: Admin App, EAS Build, and CI Pipeline Summary

**Next.js 16 admin app with @opennextjs/cloudflare adapter, shadcn/ui dark theme (teal #00E5C3 accent), EAS Build registered, and GitHub Actions CI pipeline with Supabase migration test job**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T05:10:28Z
- **Completed:** 2026-03-18T05:15:28Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Admin app typechecks and Next.js build passes with @opennextjs/cloudflare configured
- shadcn/ui dark theme initialized with all UI-SPEC CSS variables (background #000, primary teal HSL 170 100% 45%)
- EAS project registered (ID: 4f63285c-d678-4309-84e8-43e9897eb820) with dev/preview/production build profiles
- GitHub Actions CI pipeline with 5 jobs: lint-typecheck, build, test, migration-test (Supabase Docker), eas-build (tag-only)

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js admin app with @opennextjs/cloudflare and shadcn/ui dark theme** - `5e0a1d8` (feat)
2. **Task 2: Configure EAS Build and GitHub Actions CI pipeline** - `9ed425c` (feat)

## Files Created/Modified

- `apps/admin/open-next.config.ts` — @opennextjs/cloudflare adapter config using defineCloudflareConfig
- `apps/admin/wrangler.jsonc` — Cloudflare Workers config (name: wecord-admin, .open-next/worker.js entry)
- `apps/admin/next.config.ts` — initOpenNextCloudflareForDev() for dev environment
- `apps/admin/app/globals.css` — HSL CSS variables for shadcn/ui dark theme matching UI-SPEC
- `apps/admin/app/layout.tsx` — html className="dark" for dark-first theming
- `apps/admin/app/page.tsx` — Hello World page with primary/muted-foreground tokens
- `apps/admin/components.json` — shadcn/ui config (base-nova style, tailwind v4, dark mode)
- `apps/admin/package.json` — @opennextjs/cloudflare, wrangler, shadcn deps; typecheck/preview scripts
- `apps/admin/tsconfig.json` — extends @wecord/typescript-config/nextjs
- `apps/mobile/eas.json` — EAS Build profiles (development/preview/production)
- `apps/mobile/app.json` — EAS projectId added
- `.github/workflows/ci.yml` — Full CI pipeline YAML

## Decisions Made

- Used `defineCloudflareConfig` (not `defineConfig`) — verified against @opennextjs/cloudflare v1.17.1 type exports
- shadcn init via `npx shadcn@latest init --defaults` failed (npm tries to resolve workspace:* protocol); installed shadcn deps manually via pnpm instead
- html `className="dark"` chosen over `prefers-color-scheme` media query since admin is a dark-only app
- EAS project init run with `--force` to create the project since it didn't exist yet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed apps/mobile expo-localization version 15.0.4 (does not exist)**
- **Found during:** Task 1 (pnpm install from root)
- **Issue:** `expo-localization@~15.0.4` caused `ERR_PNPM_NO_MATCHING_VERSION` — version 15.0.4 does not exist in npm registry (correct SDK 55 version is 55.0.9)
- **Fix:** Updated apps/mobile/package.json: `"expo-localization": "~55.0.9"`
- **Files modified:** apps/mobile/package.json
- **Verification:** pnpm install completed successfully
- **Committed in:** 5e0a1d8 (Task 1 commit)

**2. [Rule 1 - Bug] Used defineCloudflareConfig instead of defineConfig in open-next.config.ts**
- **Found during:** Task 1 (typecheck)
- **Issue:** Plan specified `defineConfig` but @opennextjs/cloudflare v1.17.1 exports `defineCloudflareConfig` — typecheck error TS2305
- **Fix:** Changed import to `defineCloudflareConfig` from `@opennextjs/cloudflare`
- **Files modified:** apps/admin/open-next.config.ts
- **Verification:** `pnpm --filter admin typecheck` passes
- **Committed in:** 5e0a1d8 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes required for correctness. No scope creep.

## Issues Encountered

- shadcn init `--defaults` flag uses npm internally which cannot resolve `workspace:*` protocol — worked around by manually installing clsx, tailwind-merge, class-variance-authority, lucide-react via pnpm. components.json was still generated by shadcn init.

## User Setup Required

Before using EAS Build in CI, add `EXPO_TOKEN` to GitHub repository secrets:
1. Go to https://expo.dev/accounts/sangwopark19icons/settings/access-tokens
2. Create a new access token
3. Add it as `EXPO_TOKEN` in GitHub repository secrets (Settings > Secrets > Actions)

Verification: `eas project:info` in apps/mobile directory

## Next Phase Readiness

- Phase 1 (Foundation) is now complete — all 4 plans executed
- Admin app build pipeline validated (Next.js build passes, @opennextjs/cloudflare adapter configured)
- CI quality gates active from day one (lint, typecheck, build, migration-test, eas-build on tags)
- EAS registered and ready for mobile builds on release tags
- No blockers for Phase 2

## Self-Check: PASSED

All files confirmed present:
- apps/admin/open-next.config.ts: FOUND
- apps/admin/wrangler.jsonc: FOUND
- apps/admin/app/globals.css: FOUND
- apps/admin/app/layout.tsx: FOUND
- apps/admin/app/page.tsx: FOUND
- apps/admin/components.json: FOUND
- .github/workflows/ci.yml: FOUND
- apps/mobile/eas.json: FOUND

All commits confirmed:
- 5e0a1d8 (Task 1): FOUND
- 9ed425c (Task 2): FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-18*
