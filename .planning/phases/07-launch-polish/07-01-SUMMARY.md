---
phase: 07-launch-polish
plan: 01
subsystem: mobile-account-hub
tags: [mobile, expo-router, tabs, profile, i18n, settings, more-tab, auth, security]
requires:
  - .planning/PROJECT.md
  - .planning/phases/07-launch-polish/07-CONTEXT.md
  - .planning/phases/07-launch-polish/07-UI-SPEC.md
  - .planning/phases/07-launch-polish/07-VALIDATION.md
provides:
  - 5-tab bottom navigation (home/community/shop/dm/more) with notifications hidden via href:null
  - More hub screen — ProfileCard + joined communities (max 5 + view-all) + settings entry + about + destructive logout
  - Profile edit screen (nickname 2-20 / bio ≤150 / avatar via ActionSheet)
  - Settings screen — Language / Push (with OS permission reconcile) / Per-community / Terms / Privacy / Version
  - Joined communities list screen
  - Language settings screen with immediate i18n + persistent profiles.language
  - authStore.signOut hardened with try/finally + onSignOut callback slot for queryClient.clear (T-7-05)
  - Apple Sign-In above Google with snapshot test gate (T-7-07)
  - dm_launch_notify column added to profiles (powers DMPL-01/02 in 07-02)
  - i18n more + settings namespaces shipped in all 5 supported languages (KO/EN/TH/ZH-CN/JA)
affects:
  - apps/mobile/stores/authStore.ts (Profile shape extension; signOut hardening)
  - apps/mobile/app/(tabs)/_layout.tsx (2 tabs → 5 tabs)
  - apps/mobile/app/(onboarding)/language.tsx (refactored to share LanguagePicker)
  - apps/mobile/app/_layout.tsx (ActionSheetProvider + onSignOut registration)
  - apps/mobile/app/(auth)/login.tsx (Apple-first reorder for Guideline 4.8)
  - packages/db/src/schema/auth.ts (profiles.dm_launch_notify)
  - packages/shared/src/i18n/index.ts (more/settings namespace registration; en fallback)
tech-stack:
  added:
    - "@expo/react-native-action-sheet@^4.1.1"
  patterns:
    - "Optimistic mutation with onMutate/onError/onSettled (analog: useNotificationPreferences)"
    - "PostgREST !inner join + array-or-object normalization (Phase 06 pattern)"
    - "Pure helper extracted from React hook to bypass @testing-library/react-native peer pin (shallowDirty / reconcilePushToggle)"
    - "Injected cleanup callback to break Zustand ↔ TanStack import cycle"
    - "Source-order snapshot test against compliance-critical UI ordering (T-7-07 Guideline 4.8)"
key-files:
  created:
    - apps/mobile/app/(tabs)/shop.tsx           # placeholder — overwritten by 07-02 Task 3
    - apps/mobile/app/(tabs)/dm.tsx             # placeholder — overwritten by 07-02 Task 4
    - apps/mobile/app/(tabs)/more.tsx
    - apps/mobile/app/(more)/_layout.tsx
    - apps/mobile/app/(more)/profile-edit.tsx
    - apps/mobile/app/(more)/settings.tsx
    - apps/mobile/app/(more)/joined-communities.tsx
    - apps/mobile/app/(more)/language.tsx
    - apps/mobile/components/settings/LanguagePicker.tsx
    - apps/mobile/components/settings/SettingsRow.tsx
    - apps/mobile/components/more/ProfileCard.tsx
    - apps/mobile/components/more/JoinedCommunityRow.tsx
    - apps/mobile/components/more/AvatarActionSheet.tsx
    - apps/mobile/hooks/profile/useUpdateProfile.ts
    - apps/mobile/hooks/profile/useUploadAvatar.ts
    - apps/mobile/hooks/profile/useDirtyState.ts
    - apps/mobile/hooks/community/useMyCommunities.ts
    - apps/mobile/hooks/settings/usePushPermission.ts
    - apps/mobile/tests/__mocks__/action-sheet.ts
    - apps/mobile/tests/profile/useUpdateProfile.test.ts
    - apps/mobile/tests/profile/useUploadAvatar.test.ts
    - apps/mobile/tests/profile/dirty-state.test.ts
    - apps/mobile/tests/settings/language-change.test.ts
    - apps/mobile/tests/settings/push-switch.test.ts
    - apps/mobile/tests/community/useMyCommunities.test.ts
    - apps/mobile/tests/auth/signOut.test.ts
    - apps/mobile/tests/auth/signOut-queryclient-integration.test.ts
    - apps/mobile/tests/auth/login-snapshot.test.ts
    - packages/supabase/migrations/20260422000001_phase7_profile_dm_launch_notify.sql
    - packages/shared/src/i18n/locales/ko/more.json
    - packages/shared/src/i18n/locales/en/more.json
    - packages/shared/src/i18n/locales/th/more.json
    - packages/shared/src/i18n/locales/zh/more.json
    - packages/shared/src/i18n/locales/ja/more.json
    - packages/shared/src/i18n/locales/ko/settings.json
    - packages/shared/src/i18n/locales/en/settings.json
    - packages/shared/src/i18n/locales/th/settings.json
    - packages/shared/src/i18n/locales/zh/settings.json
    - packages/shared/src/i18n/locales/ja/settings.json
    - .planning/phases/07-launch-polish/deferred-items.md
  modified:
    - apps/mobile/stores/authStore.ts
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/(onboarding)/language.tsx
    - apps/mobile/app/(auth)/login.tsx
    - apps/mobile/package.json
    - apps/mobile/vitest.config.ts
    - packages/db/src/schema/auth.ts
    - packages/shared/src/i18n/index.ts
    - packages/shared/src/i18n/locales/ko/common.json
    - packages/shared/src/i18n/locales/en/common.json
    - packages/shared/src/i18n/locales/th/common.json
    - packages/shared/src/i18n/locales/zh/common.json
    - packages/shared/src/i18n/locales/ja/common.json
decisions:
  - "FormState type widened with `& Record<string, unknown>` so it satisfies useDirtyState's generic constraint without losing field types"
  - "Pure shallowDirty + reconcilePushToggle exported alongside their hook wrappers — sidesteps @testing-library/react-native's strict react-test-renderer peer pin (19.2.4 vs 19.2.3)"
  - "Cycle break for T-7-05: authStore exposes registerOnSignOut(cb) instead of importing queryClient. _layout.tsx wires queryClient.clear via useEffect"
  - "App version sourced from app.json (require) — expo-application not installed; documented in plan, no install needed"
  - "useUploadAvatar inferMimeFromUri: unknown extensions (.pdf/.mp4/...) return 'unknown' so allowlist rejects pre-upload (T-7-04 hardening beyond plan letter)"
  - "Vitest test environment is 'web' (Platform.OS==='web') so the web upload branch is exercised; getInfoAsync code path tested via blob.size cap"
  - "Apple-first OAuth ordering enforced via source-order snapshot (cheaper than RTL) — survives Plan 07-03 re-run"
metrics:
  duration_minutes: 22
  completed: 2026-04-22
  tasks_completed: 8
  files_created: 41
  files_modified: 14
  tests_added: 24
  tests_total_passing: 73
  tests_total_skipped_or_todo: 37
---

# Phase 07 Plan 01: More Tab + 5-Tab Nav + Account Hub Summary

Account hub MVP shipped: Weverse-style 5-tab navigation, single-page profile edit (nickname/bio/avatar), iOS-style settings (language/push/legal/version), joined-communities list, hardened signOut with cache-eviction, and an Apple-Sign-In-above-Google compliance gate — all tests + types green.

## What Shipped

- **Navigation:** Bottom tabs expanded to 5 (Home/Community/Shop/DM/More); notifications hidden via `href:null`. Each tab uses focused/outline Ionicons variants.
- **More hub:** ProfileCard (avatar+nickname+bio) → "Edit profile" → joined communities (top 5 + view-all) → Settings entry → About → destructive Log Out row.
- **Profile edit:** Single-screen form with header Save button disabled until `isDirty + nicknameValid + !pending`. Avatar tap opens ActionSheet (camera/library/default/remove); upload pipeline resizes to 512×512 JPEG q=0.8 with 2 MB cap and MIME allowlist.
- **Settings:** Language row navigates to dedicated picker that fires `i18n.changeLanguage` + persists `profiles.language`. Push switch reads OS state on `useFocusEffect` and routes through `Linking.openSettings()` for permanent-deny + ON→OFF (cannot revoke from app). Legal rows open admin-hosted URLs with `?lang=` param.
- **Auth:** `authStore.signOut` wraps `supabase.auth.signOut` in `try/finally`; an injected `onSignOut` callback (registered at root via `useEffect`) clears the TanStack `queryClient` cache without an authStore→queryClient import cycle. Logout completes even when network or cleanup throws.
- **Compliance:** Apple Sign-In rendered ABOVE Google (was below — fixed). Snapshot test asserts source order — gate survives Plan 07-03 re-run.

## Tasks Completed

| #   | Task                                                          | Commit  | Notes |
| --- | ------------------------------------------------------------- | ------- | ----- |
| 1   | Wave 0 stubs + i18n more/settings (10 JSONs, 5 langs)         | 3f6aabe | 7 stub files + action-sheet mock + en fallback per Codex review |
| 2   | Schema + hooks (useUpdateProfile/Avatar/DirtyState/MyComms)   | e823eaa | Migration 20260422000001; bio + dmLaunchNotify into Profile; 4 stubs → real tests |
| 2b  | Placeholder shop.tsx + dm.tsx                                 | 0e7bced | Required so Task 3's `<Tabs.Screen name="shop"/>` resolves; overwritten by 07-02 |
| 3   | 5-tab + More hub + shared components                          | e60221d | LanguagePicker / SettingsRow / ProfileCard / JoinedCommunityRow / AvatarActionSheet; ActionSheetProvider in root |
| 4   | profile-edit / joined-communities / language settings screens | 8cc6ed7 | language-change test promoted (4 assertions) |
| 5   | settings screen + usePushPermission helper                    | 13597e9 | push-switch test promoted (4 assertions, including ON→OFF no-optimistic-flip) |
| 6   | authStore.signOut hardening (T-7-05)                          | de9e3c4 | onSignOut callback slot; finally guarantee; 6 unit tests + 1 integration test |
| 7   | Apple-first reorder + snapshot (T-7-07)                       | 35c64d5 | Apple-above-Google enforced via source-order snapshot |

## Requirements Covered

- **MORE-01** Profile edit (nickname/bio/avatar) — `(more)/profile-edit.tsx` + useUpdateProfile + useUploadAvatar + useDirtyState
- **MORE-02** Language switching (i18n + persistence) — `(more)/language.tsx` + LanguagePicker(mode=settings)
- **MORE-03** Joined communities list — `(more)/joined-communities.tsx` + useMyCommunities + JoinedCommunityRow
- **MORE-04** Settings (push/per-community/legal/version) — `(more)/settings.tsx` + usePushPermission
- **MORE-05** Logout — More tab Alert → `useAuthStore.signOut()` (cache.clear via registered cb) → `router.replace('/(auth)/login')`

## Threat Controls Verified

| Threat | Mitigation | Verified by |
| ------ | ---------- | ----------- |
| T-7-03 | `useUpdateProfile` filters with `.eq('user_id', user.id)`; server enforces `profiles_update_own` RLS | `tests/profile/useUpdateProfile.test.ts` asserts `lastEqArgs === ['user_id','user-1']` |
| T-7-04 | MIME allowlist (jpeg/png/webp; unknown extensions rejected) + 2 MB cap on compressed output | `tests/profile/useUploadAvatar.test.ts` rejects `.pdf` URI and a 3 MB blob |
| T-7-05 | `signOut` try/finally clears state + invokes registered `onSignOut(queryClient.clear)` even on network failure or callback throw | `tests/auth/signOut.test.ts` (6 assertions) + `signOut-queryclient-integration.test.ts` (primed cache empty after signOut) |
| T-7-07 | Apple Sign-In rendered above Google with `testID` markers; source-order snapshot enforces ordering | `tests/auth/login-snapshot.test.ts` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Apple Sign-In was rendered BELOW Google in `login.tsx`**
- **Found during:** Task 7
- **Issue:** Phase 2 implementation placed Google first, Apple second — violates Apple Guideline 4.8 ("equivalent or more prominent"). T-7-07 explicitly flagged this as a Phase 7 gate.
- **Fix:** Reordered JSX so Apple OAuth button block precedes Google's; added `testID` + `accessibilityLabel` on both for the snapshot test.
- **Files modified:** `apps/mobile/app/(auth)/login.tsx`
- **Commit:** 35c64d5

**2. [Rule 1 — Bug] `useDirtyState`'s generic constraint conflicted with concrete `FormState` interface**
- **Found during:** Task 4 typecheck
- **Issue:** TS2344 — `interface FormState` did not satisfy `Record<string, unknown>` constraint (no string index signature).
- **Fix:** Switched to `type FormState = { … } & Record<string, unknown>`.
- **Files modified:** `apps/mobile/app/(more)/profile-edit.tsx`
- **Commit:** 8cc6ed7

**3. [Rule 1 — Bug] `getInfoAsync(uri, { size: true })` rejected by SDK 55 InfoOptions type**
- **Found during:** Task 2 typecheck
- **Issue:** TS2353 — `size` not a valid InfoOptions key in the installed `expo-file-system/legacy` types.
- **Fix:** Removed the option; the function returns `size` by default on native. Cast accessed via narrowed shape `(info as { size?: number }).size`.
- **Files modified:** `apps/mobile/hooks/profile/useUploadAvatar.ts`
- **Commit:** e823eaa

**4. [Rule 1 — Bug] `inferMimeFromUri` accepted any unknown extension as JPEG**
- **Found during:** Task 2 test for T-7-04 MIME allowlist
- **Issue:** `.pdf`, `.mp4`, etc. fell through to the JPEG fallback, defeating the allowlist gate.
- **Fix:** Detected dot-extension and returned `'unknown'` for non-image extensions; only truly extensionless URIs (e.g. expo-image-picker assets) keep the JPEG default. Strengthens T-7-04 beyond the plan's letter.
- **Files modified:** `apps/mobile/hooks/profile/useUploadAvatar.ts`
- **Commit:** e823eaa

### Auto-added Critical Functionality

**5. [Rule 2 — Critical] Test environment compatibility shim — pure helpers separated from hooks**
- **Found during:** Task 2 (dirty-state test) and Task 5 (push-switch test)
- **Issue:** `@testing-library/react-native@13.3.3` pins `react-test-renderer@19.2.3` while the resolved version is 19.2.4 — `renderHook` throws at import time, blocking any hook-based test. Without a workaround, three required test stubs would remain unimplementable in this plan.
- **Fix:** Extracted pure compute layer (`shallowDirty`, `reconcilePushToggle`, `readPushPermission`, `uploadAvatar`) so tests exercise contract logic without React lifecycle. Hooks remain intact.
- **Files modified:** `apps/mobile/hooks/profile/useDirtyState.ts`, `apps/mobile/hooks/settings/usePushPermission.ts`, `apps/mobile/hooks/profile/useUploadAvatar.ts`
- **Commits:** e823eaa, 13597e9

**6. [Rule 2 — Critical] Symlinked node_modules from main repo into worktree**
- **Found during:** Task 1 baseline test run (pre-Task-1 sanity check)
- **Issue:** Worktree had no `node_modules`; `vitest`/`tsc` not on PATH. Without dependencies the entire plan would be uncommitable.
- **Fix:** `ln -s` from `/main/node_modules` (and per-package node_modules) into worktree. Reversible; merge step is unaffected.
- **Files modified:** none committed (symlinks are local-only)

### Auto-fixed Blocking Issues

**7. [Rule 3 — Blocker] Vitest mock for `@expo/react-native-action-sheet` had no module to alias**
- **Found during:** Task 1 (vitest.config.ts wiring)
- **Issue:** Plan called for an alias to a stub file in `tests/__mocks__/`. The default vitest `alias` config is just a record — needs an absolute path resolver.
- **Fix:** Used `new URL('./tests/__mocks__/action-sheet.ts', import.meta.url).pathname` to derive the absolute path declaratively.
- **Files modified:** `apps/mobile/vitest.config.ts`
- **Commit:** 3f6aabe

### Authentication Gates

None — no remote auth required for Plan 07-01.

## Manual Smoke Test (saved for end-of-phase checkpoint in Plan 07-03)

- Launch app → see 5 tabs at bottom; teal Home active by default
- Tap More → ProfileCard renders avatar/nickname/bio preview
- Tap "프로필 편집" → edit nickname → header "저장" enables → tap → success toast → name updates in More tab
- Tap avatar → ActionSheet appears with 4 options (3 if no custom avatar)
- Settings → Language → select English → UI immediately switches to English; back to More shows "Edit profile"
- Settings → Push → toggle → appropriate OS prompt or Alert appears
- More → "가입한 커뮤니티" → list renders (or empty state)
- More → Log out → Alert with destructive button → tap → navigates to login screen
- Relaunch app → still logged out

## Known Stubs

- `apps/mobile/app/(tabs)/shop.tsx` and `apps/mobile/app/(tabs)/dm.tsx` are intentional placeholders ("Coming soon" labels). Plan 07-02 Task 3 + Task 4 overwrite these files with production WebView (Shop) and DM placeholder + Notify Me toggle. Documented in 07-02 task ordering.

## Threat Flags

None new beyond the plan's existing `<threat_model>` register. All four IDs (T-7-03/04/05/07) had their mitigations implemented and verified.

## Follow-ups Owned by Other Plans

- **Plan 07-02:** Overwrites `(tabs)/shop.tsx` (WebView) and `(tabs)/dm.tsx` (DM placeholder + Notify Me toggle wiring `dm_launch_notify`). 07-02 also fills the remaining Wave 0 stubs (shop/dm/account).
- **Plan 07-03:** Replaces hardcoded `https://wecord-docs.pages.dev/{terms,privacy}` URLs with the production admin domain once `apps/admin/app/(public)/{terms,privacy}/page.tsx` ships. Also re-runs the login snapshot pre-submission.
- **Plan 07-03:** `app.json` plugins MUST NOT include `expo-tracking-transparency` (consistency with this plan's removal per Codex review).

## Review Concerns Addressed

| Severity | Concern | Resolution |
| -------- | ------- | ---------- |
| HIGH     | Route ordering — shop/dm tab declaration before route file exists | Task 2b creates placeholder files before Task 3 wires Tabs.Screen entries |
| MEDIUM   | ATT (`expo-tracking-transparency`) installed-but-unused           | Not installed; no mock; verified via grep gate                                      |
| MEDIUM   | i18n scope — 5-language requirement (PROJECT.md §72)              | 10 JSONs total (ko/en/th/zh/ja × more/settings) shipped with translations           |
| MEDIUM   | authStore ↔ queryClient direct import cycle                       | Refactored to onSignOut callback slot + root-level useEffect registration           |
| LOW      | Push OFF UX (cannot revoke from app)                              | Alert + Linking.openSettings; switch state stays until OS state changes (verified via test) |

## Self-Check: PASSED

Verified all listed artifacts exist on disk and all commits exist in `git log`:

- `[ ✓ ]` 7 commits present (3f6aabe, e823eaa, 0e7bced, e60221d, 8cc6ed7, 13597e9, de9e3c4) + Task 7 commit (35c64d5) = 8 task commits
- `[ ✓ ]` 41 created files exist (verified by `ls`/`grep` gates during execution)
- `[ ✓ ]` 14 modified files reflect changes (verified by typecheck + tests passing)
- `[ ✓ ]` `pnpm typecheck` exits 0
- `[ ✓ ]` `pnpm test` exits 0 with 73 tests passing, 37 todo, 0 failing
- `[ ✓ ]` All grep gates from `<verification>` section pass
- `[ ✓ ]` Worktree mode honored — no edits to `.planning/STATE.md` or `.planning/ROADMAP.md`
- `[ – ]` `pnpm lint` skipped — pre-existing ESLint v9 config gap also present on main; logged in `deferred-items.md`
