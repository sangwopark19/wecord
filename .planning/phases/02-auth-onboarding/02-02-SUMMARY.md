---
phase: 02-auth-onboarding
plan: 02
subsystem: ui
tags: [expo-router, react-native, nativewind, i18next, tanstack-query, supabase, onboarding]

# Dependency graph
requires:
  - phase: 02-auth-onboarding/02-01
    provides: authStore with session/profile, supabase client, generate-nickname edge function, i18n infrastructure

provides:
  - 4-step onboarding flow (ToS -> DoB -> Language -> Curation)
  - OnboardingDotIndicator reusable component
  - PrimaryCTAButton reusable component
  - onboardingData persistence in authStore (dateOfBirth across screens)
  - ToS acceptance gate (checkbox required to proceed)
  - Age verification gate (age < 14 blocked with error)
  - Language selection persisted to i18next runtime + Supabase profiles table
  - Spotify-style creator curation with multi-select and auto-join via generate-nickname
  - onboarding_completed=true written to profiles on completion
  - Auth guard in root _layout.tsx routes completed users to tabs

affects: [03-community-feed, 04-notifications, all phases using profile.onboardingCompleted]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Onboarding data held in authStore (onboardingData field) for cross-screen DoB persistence
    - useSegments() to map route segment to dot indicator step number
    - as never cast for dynamic routes not yet in expo-router type registry (acceptable pattern during development)

key-files:
  created:
    - apps/mobile/components/OnboardingDotIndicator.tsx
    - apps/mobile/components/PrimaryCTAButton.tsx
    - apps/mobile/app/(onboarding)/_layout.tsx
    - apps/mobile/app/(onboarding)/tos.tsx
    - apps/mobile/app/(onboarding)/dob.tsx
    - apps/mobile/app/(onboarding)/language.tsx
    - apps/mobile/app/(onboarding)/curate.tsx
    - apps/mobile/app/(onboarding)/complete.tsx
  modified:
    - apps/mobile/stores/authStore.ts

key-decisions:
  - "i18n.changeLanguage imported from i18next directly (not @wecord/shared which has no default export)"
  - "as never cast for /(onboarding)/curate and /(onboarding)/complete routes — avoids TypeScript complaint while expo-router regenerates types"
  - "onboardingData stored in authStore instead of expo-router params — simpler than passing dateOfBirth as route param through multiple screens"
  - "Complete screen writes all onboarding data (date_of_birth, onboarding_completed) in single profiles.update call"

patterns-established:
  - "Onboarding screens: SafeAreaView edges=['bottom'] + flex-1 px-4 layout + PrimaryCTAButton in pb-6 footer"
  - "Animated dot indicator: Animated.Value with useEffect + timing 200ms for active scale"
  - "Creator curation: FlatList numColumns=2 with Pressable scale animation on card tap"

requirements-completed: [AUTH-05, AUTH-06, AUTH-07, AUTH-08]

# Metrics
duration: 20min
completed: 2026-03-18
---

# Phase 2 Plan 02: Onboarding Flow Summary

**4-step onboarding (ToS -> DoB -> Language -> Curation) with age gate, i18next language switching, Spotify-style community curation auto-join via generate-nickname, and onboarding_completed flag write-back**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-18T08:43:30Z
- **Completed:** 2026-03-18T09:03:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Full 4-step onboarding flow: ToS (checkbox gate) -> DoB (age >= 14 gate) -> Language (5 options, i18next + Supabase) -> Curation (Spotify-style grid, skippable)
- Reusable OnboardingDotIndicator (animated active dot) and PrimaryCTAButton (teal/disabled/loading states)
- Creator curation with TanStack Query fetch, 2-column grid, multi-select, skeleton loading, auto-join via generate-nickname Edge Function + community_members INSERT
- Complete screen writes date_of_birth + onboarding_completed=true to profiles, then router.replace to tabs

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared components, layout, ToS, DoB** - `adcdf1e` (feat)
2. **Task 2: Language, Curation, Complete screens** - `d9a239c` (feat)

## Files Created/Modified
- `apps/mobile/components/OnboardingDotIndicator.tsx` - Animated 4-dot progress indicator; active dot scales 1.0->1.25 teal, inactive #2A2A2A
- `apps/mobile/components/PrimaryCTAButton.tsx` - Teal pill CTA button with disabled/loading/pressed states
- `apps/mobile/app/(onboarding)/_layout.tsx` - Stack layout with dot indicator tracking current segment via useSegments
- `apps/mobile/app/(onboarding)/tos.tsx` - Scrollable ToS with checkbox; CTA disabled until accepted
- `apps/mobile/app/(onboarding)/dob.tsx` - Native DateTimePicker; blocks users under 14 with Korean error message
- `apps/mobile/app/(onboarding)/language.tsx` - FlatList of 5 languages with radio selection; updates i18next + profiles.language
- `apps/mobile/app/(onboarding)/curate.tsx` - 2-column creator grid with multi-select; auto-joins via generate-nickname + community_members INSERT
- `apps/mobile/app/(onboarding)/complete.tsx` - Writes onboarding_completed=true + date_of_birth, then replaces to /(tabs)
- `apps/mobile/stores/authStore.ts` - Added onboardingData field + setOnboardingData action for DoB cross-screen persistence

## Decisions Made
- i18next imported directly (not @wecord/shared which has no default export) for changeLanguage call in language.tsx
- `as never` cast for dynamic onboarding routes — avoids TypeScript complaint while expo-router regenerates types at next build
- onboardingData in authStore (not route params) for clean DoB persistence across multiple navigation hops

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added onboardingData/setOnboardingData to authStore**
- **Found during:** Task 1 (dob.tsx implementation)
- **Issue:** Plan specified using authStore or separate store for dateOfBirth persistence; authStore lacked the field
- **Fix:** Added `onboardingData: OnboardingData | null` state + `setOnboardingData` action to authStore; reset on signOut
- **Files modified:** apps/mobile/stores/authStore.ts
- **Verification:** TypeScript compilation passes with no errors
- **Committed in:** adcdf1e (Task 1 commit)

**2. [Rule 1 - Bug] Fixed i18n import in language.tsx**
- **Found during:** Task 2 verification (typecheck)
- **Issue:** `import i18n from '@wecord/shared'` fails — shared package has no default export
- **Fix:** Changed to `import i18n from 'i18next'` which is the underlying instance
- **Files modified:** apps/mobile/app/(onboarding)/language.tsx
- **Verification:** `pnpm --filter mobile typecheck` passes
- **Committed in:** d9a239c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- None beyond the two auto-fixed issues above.

## User Setup Required
None - no external service configuration required beyond what was set up in 02-01.

## Next Phase Readiness
- Full onboarding flow is navigable: login -> tos -> dob -> language -> curate -> home
- Auth guard in root layout handles routing for authenticated/completed users
- Ready for Phase 3: Community Feed (posts, reactions, persona-isolated nicknames)

---
*Phase: 02-auth-onboarding*
*Completed: 2026-03-18*
