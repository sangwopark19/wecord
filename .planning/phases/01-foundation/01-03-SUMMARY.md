---
phase: 01-foundation
plan: 03
subsystem: ui, infra
tags: [expo, nativewind, tailwind, i18next, react-i18next, i18n, dark-theme, expo-router]

# Dependency graph
requires:
  - phase: 01-01
    provides: pnpm monorepo scaffold, @wecord/typescript-config, @wecord/shared stub
provides:
  - Expo SDK 55 mobile app at apps/mobile with expo-router and Nativewind v4
  - Dark theme design system (tailwind.config.js with all UI-SPEC color tokens)
  - i18n scaffold: initI18n() function exported from @wecord/shared
  - 10 locale JSON files (5 languages x 2 namespaces: common, auth)
affects: [02-auth, 03-community, all mobile phases]

# Tech tracking
tech-stack:
  added:
    - nativewind@4.2.3 (Tailwind CSS for React Native)
    - expo-router@4.0.22 (file-based routing)
    - i18next@25.8.18 (i18n framework)
    - react-i18next@16.5.8 (React bindings)
    - "@expo/vector-icons (Ionicons for tab icons)"
    - expo-localization@15.0.4
    - "@react-native-async-storage/async-storage@2.1.0"
    - tailwindcss@3.4.x (CSS utility for Nativewind)
  patterns:
    - Nativewind v4 setup: metro.config.js wraps config with withNativewind, global.css imports Tailwind directives
    - i18n pattern: initI18n() function (not auto-init) to keep shared package platform-agnostic
    - Root layout imports global.css and calls initI18n() before any render
    - Monorepo metro: watchFolders + resolver.nodeModulesPaths for cross-package resolution

key-files:
  created:
    - apps/mobile/tailwind.config.js (UI-SPEC color tokens, typography, font weights)
    - apps/mobile/metro.config.js (withNativewind + monorepo support)
    - apps/mobile/global.css (Tailwind directives)
    - apps/mobile/babel.config.js (nativewind/babel preset)
    - apps/mobile/nativewind-env.d.ts (type reference)
    - apps/mobile/app/_layout.tsx (root layout: CSS import + initI18n call)
    - apps/mobile/app/(tabs)/_layout.tsx (tab layout with dark theme)
    - apps/mobile/app/(tabs)/index.tsx (home placeholder)
    - apps/mobile/app/+not-found.tsx (404 screen)
    - packages/shared/src/i18n/index.ts (initI18n + SUPPORTED_LANGUAGES)
    - packages/shared/src/i18n/locales/{ko,en,th,zh,ja}/{common,auth}.json
  modified:
    - apps/mobile/package.json (added workspace deps, scripts, expo-router entry)
    - apps/mobile/app.json (dark theme, scheme, expo-router plugin)
    - apps/mobile/tsconfig.json (extends monorepo expo.json, path aliases)
    - packages/shared/src/index.ts (exports initI18n, SUPPORTED_LANGUAGES)

key-decisions:
  - "Used initI18n() function pattern (not auto-init at module level) to keep @wecord/shared platform-agnostic — apps provide languageCode at startup"
  - "Nativewind v4.2.3 installed; typecheck passes — expo export smoke test deferred to manual verification"
  - "Added @expo/vector-icons as explicit dep (not bundled with Expo SDK 55 blank template)"
  - "expo-localization import deferred to Phase 2 mobile integration — initI18n accepts optional languageCode param"

patterns-established:
  - "Pattern: initI18n(languageCode?) called at top-level of _layout.tsx before component render"
  - "Pattern: global.css imported as first line of _layout.tsx (before expo-router imports)"
  - "Pattern: Nativewind className props on View/Text for dark theme colors (bg-background, text-foreground, etc.)"

requirements-completed: [FOUN-05, FOUN-06, FOUN-08]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 01 Plan 03: Mobile App + i18n Scaffold Summary

**Expo SDK 55 mobile app with Nativewind v4 dark theme (background #000000, accent #00E5C3) and i18next scaffold exporting initI18n() across 5 languages (KO/EN/TH/ZH/JA) with common and auth namespaces**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-18T05:10:23Z
- **Completed:** 2026-03-18T05:14:00Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments

- Expo SDK 55 mobile app with expo-router, Nativewind v4, and dark theme fully configured
- All UI-SPEC color tokens (11 colors) and typography (4 roles, 2 weights) declared in tailwind.config.js
- i18n scaffold: 10 locale JSON files with all copywriting keys; initI18n() exported from @wecord/shared
- apps/mobile/_layout.tsx calls initI18n() at startup — translations available at runtime
- Both `pnpm --filter mobile typecheck` and `pnpm --filter @wecord/shared typecheck` pass

## Task Commits

Each task was committed atomically:

1. **Task 2: i18n scaffold (5 languages, 2 namespaces)** - `79c2ce0` (feat)
2. **Task 1: Expo SDK 55 app with Nativewind v4 dark theme** - `dfe3879` (feat)

## Files Created/Modified

- `apps/mobile/tailwind.config.js` - All UI-SPEC color tokens + typography declared
- `apps/mobile/metro.config.js` - withNativewind wrapper + monorepo watchFolders
- `apps/mobile/global.css` - Tailwind base/components/utilities
- `apps/mobile/babel.config.js` - nativewind/babel preset with jsxImportSource
- `apps/mobile/nativewind-env.d.ts` - nativewind/types reference
- `apps/mobile/app/_layout.tsx` - Root layout: global.css import + initI18n() call
- `apps/mobile/app/(tabs)/_layout.tsx` - Tab layout with dark theme colors
- `apps/mobile/app/(tabs)/index.tsx` - Home placeholder using Nativewind classes
- `apps/mobile/app/+not-found.tsx` - 404 screen
- `apps/mobile/package.json` - Added @wecord/shared, nativewind, expo-router, etc.
- `apps/mobile/app.json` - Dark theme, scheme, expo-router plugin, experiments
- `apps/mobile/tsconfig.json` - Extends monorepo expo.json, path aliases for @wecord/shared
- `packages/shared/src/i18n/index.ts` - initI18n(), SUPPORTED_LANGUAGES, resources
- `packages/shared/src/i18n/locales/*/common.json` (5 files) - All UI-SPEC copywriting keys
- `packages/shared/src/i18n/locales/*/auth.json` (5 files) - Logout keys
- `packages/shared/src/index.ts` - Exports initI18n and SUPPORTED_LANGUAGES

## Decisions Made

- Used `initI18n(languageCode?)` function pattern (not module-level auto-init) to keep `@wecord/shared` platform-agnostic. Apps call it at startup with their detected locale.
- expo-localization import deferred to Phase 2 — initI18n accepts optional languageCode so the mobile app can pass Localization.getLocales()[0]?.languageCode in Phase 2.
- Added `@expo/vector-icons` as an explicit dependency — not bundled with blank-typescript Expo template.
- TH/ZH/JA translations use English values as placeholders per UI-SPEC: "English values are acceptable as placeholders for TH/ZH/JA in Phase 1".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @expo/vector-icons as explicit dependency**
- **Found during:** Task 1 (typecheck)
- **Issue:** `app/(tabs)/_layout.tsx` uses `Ionicons` from `@expo/vector-icons` but it was not installed — blank-typescript template does not include it
- **Fix:** `pnpm add @expo/vector-icons -F mobile`
- **Files modified:** apps/mobile/package.json, pnpm-lock.yaml
- **Verification:** `pnpm --filter mobile typecheck` passes
- **Committed in:** dfe3879 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Necessary for typecheck to pass. No scope creep.

## Issues Encountered

- Blank-typescript Expo template does not include expo-router by default — added manually along with all required dependencies (expo-router, react-native-screens, react-native-safe-area-context).
- Peer dependency warnings from expo-router 4.0.22 regarding React 19 — expected for SDK 55, not actual errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Mobile app is configured and typechecks pass. Ready for auth screens in Phase 2.
- i18n initialized with all 5 languages. Phases 2+ can use `useTranslation('common')` and `useTranslation('auth')` hooks immediately.
- Nativewind dark theme tokens all declared — Phase 2+ can use `bg-background`, `text-teal`, `bg-card`, etc.
- expo export smoke test not run (requires native toolchain). Should be validated before first EAS build.

---
*Phase: 01-foundation*
*Completed: 2026-03-18*
