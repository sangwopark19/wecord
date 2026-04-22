---
phase: 7
slug: launch-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from RESEARCH.md `## Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^3.1.0 (mobile, established in Phase 4) · Deno test (Supabase Edge Functions) |
| **Config file** | `apps/mobile/vitest.config.ts` (inherits workspace config) · `packages/supabase/functions/*/index.test.ts` (Deno) |
| **Quick run command** | `cd apps/mobile && pnpm test` |
| **Full suite command** | `cd apps/mobile && pnpm test:ci` |
| **Estimated runtime** | ~25 seconds (mobile) + ~10 seconds (deno test for Edge Functions) |

---

## Sampling Rate

- **After every task commit:** Run targeted vitest — `cd apps/mobile && pnpm test <path>` for the file(s) modified
- **After every plan wave:** Run `cd apps/mobile && pnpm test:ci` + `cd packages/supabase && deno test functions/delete-user`
- **Before `/gsd-verify-work`:** Full suite must be green; manual device smoke recorded in VERIFICATION.md
- **Max feedback latency:** 30 seconds (targeted) / 60 seconds (full)

---

## Per-Task Verification Map

Tasks are mapped at REQ-ID / decision granularity. Plan files may further split a single REQ into multiple tasks — the verification command is shared.

| Task Scope | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Profile update mutation | 07-01 | 2 | MORE-01 | T-7-03 | Self-only RLS on profiles UPDATE | unit | `pnpm test tests/profile/useUpdateProfile.test.ts` | ❌ W0 | ⬜ pending |
| Avatar upload hook | 07-01 | 2 | MORE-01 | T-7-04 | Size + MIME validation, user-scoped path | unit | `pnpm test tests/profile/useUploadAvatar.test.ts` | ❌ W0 | ⬜ pending |
| Dirty-state detection | 07-01 | 2 | MORE-01 | — | N/A | unit | `pnpm test tests/profile/dirty-state.test.ts` | ❌ W0 | ⬜ pending |
| Language change immediate | 07-01 | 2 | MORE-02 | — | N/A | unit | `pnpm test tests/settings/language-change.test.ts` | ❌ W0 | ⬜ pending |
| Joined communities query | 07-01 | 2 | MORE-03 | — | RLS ensures own memberships only | unit | `pnpm test tests/community/useMyCommunities.test.ts` | ❌ W0 | ⬜ pending |
| Push permission reconcile | 07-01 | 2 | MORE-04 | — | N/A | unit | `pnpm test tests/settings/push-switch.test.ts` | ❌ W0 | ⬜ pending |
| Sign-out state reset | 07-01 | 2 | MORE-05 | T-7-05 | SecureStore wipe + query cache clear + stack reset | unit | `pnpm test tests/auth/signOut.test.ts` | ❌ W0 | ⬜ pending |
| Shop WebView render + nav | 07-02 | 2 | SHOP-01, SHOP-02 | T-7-01 | WebView sandboxed, cookie-safe | unit (render) | `pnpm test tests/shop/ShopWebView.test.tsx` | ❌ W0 | ⬜ pending |
| Shop external-link block | 07-02 | 2 | SHOP-02 | T-7-01 | Non-x-square hostname → expo-web-browser | unit | `pnpm test tests/shop/external-link-block.test.ts` | ❌ W0 | ⬜ pending |
| Shop nav state (canGoBack) | 07-02 | 2 | SHOP-02 | — | N/A | unit | `pnpm test tests/shop/navigation-state.test.ts` | ❌ W0 | ⬜ pending |
| DM placeholder render | 07-02 | 2 | DMPL-01 | — | N/A | unit (render) | `pnpm test tests/dm/DmTab.test.tsx` | ❌ W0 | ⬜ pending |
| DM notify preference | 07-02 | 2 | DMPL-02 | T-7-06 | RLS self-update only on profiles.dm_launch_notify | unit | `pnpm test tests/dm/useDmLaunchNotify.test.ts` | ❌ W0 | ⬜ pending |
| Delete account client hook | 07-02 | 3 | D-37 | T-7-02 | JWT required; auth cleared on 200 | unit | `pnpm test tests/account/useDeleteAccount.test.ts` | ❌ W0 | ⬜ pending |
| delete-user Edge Function (auth) | 07-02 | 3 | D-37 | T-7-02 | 401 when no JWT; only own user deletable | integration | `cd packages/supabase && deno test functions/delete-user/index.test.ts` | ❌ W0 | ⬜ pending |
| delete_account RPC cascade order | 07-02 | 3 | D-37 | T-7-02 | Orphans never left; ordered cascade | SQL smoke (post-migration) | `psql -c "SELECT wv_test_delete_account_smoke();"` | ❌ W0 (smoke helper migration) | ⬜ pending |
| Login snapshot (Apple prominence) | 07-01 | 2 | D-32 (SHOP/MORE auth) | T-7-07 | Apple equal/above Google | unit (render snapshot) | `pnpm test tests/auth/login-snapshot.test.tsx` | ⚠️ Updates existing file (see Manual-Only table) | ⬜ pending |
| /privacy public route 200 | 07-02 | 4 | D-31 | — | No auth gating; HTML 200 | integration (curl, post-deploy) | `curl -sf "$APPS_ADMIN_URL/privacy"` | Manual | ⬜ pending |
| /terms public route 200 | 07-02 | 4 | D-31 | — | No auth gating; HTML 200 | integration (curl, post-deploy) | `curl -sf "$APPS_ADMIN_URL/terms"` | Manual | ⬜ pending |
| Production EAS build env parity | 07-02 | 4 | D-33 | — | Correct EXPO_PUBLIC_SUPABASE_URL | manual (EAS logs) | EAS build artifact env inspection | Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Automated sampling invariant:** After each committed task, at least one vitest command from this map runs. The planner must not introduce three consecutive tasks whose only verification is manual — every run of three tasks must include at least one automated command from this map, or a Wave 0 test stub that the current task wires up.

---

## Wave 0 Requirements

Wave 0 creates the test stubs + mocks so every later wave can commit against an existing red/green signal. All Wave 0 files live under `apps/mobile/tests/` (mobile) and `packages/supabase/functions/` (Edge Functions).

- [ ] `apps/mobile/tests/profile/useUpdateProfile.test.ts` — stubs for MORE-01 profile mutation
- [ ] `apps/mobile/tests/profile/useUploadAvatar.test.ts` — stubs for MORE-01 avatar upload
- [ ] `apps/mobile/tests/profile/dirty-state.test.ts` — stubs for MORE-01 dirty-state helper
- [ ] `apps/mobile/tests/settings/language-change.test.ts` — stubs for MORE-02 language switch side-effects
- [ ] `apps/mobile/tests/settings/push-switch.test.ts` — stubs for MORE-04 permission reconciliation
- [ ] `apps/mobile/tests/community/useMyCommunities.test.ts` — stubs for MORE-03 joined communities query
- [ ] `apps/mobile/tests/auth/signOut.test.ts` — stubs for MORE-05 sign-out side-effects
- [ ] `apps/mobile/tests/shop/ShopWebView.test.tsx` — render stubs for SHOP-01
- [ ] `apps/mobile/tests/shop/external-link-block.test.ts` — stubs for SHOP-02 `onShouldStartLoadWithRequest`
- [ ] `apps/mobile/tests/shop/navigation-state.test.ts` — stubs for SHOP-02 `canGoBack` toggling
- [ ] `apps/mobile/tests/dm/DmTab.test.tsx` — stubs for DMPL-01 placeholder render
- [ ] `apps/mobile/tests/dm/useDmLaunchNotify.test.ts` — stubs for DMPL-02 notify persistence
- [ ] `apps/mobile/tests/account/useDeleteAccount.test.ts` — stubs for D-37 client hook
- [ ] `packages/supabase/functions/delete-user/index.test.ts` — Deno test stub for D-37 Edge Function
- [ ] Shared vitest config update in `apps/mobile/vitest.config.ts` — add mocks for `react-native-webview`, `@expo/react-native-action-sheet`, `expo-web-browser`, `expo-tracking-transparency` (if the plan chooses to install it)
- [ ] `packages/supabase/migrations/<timestamp>_add_dm_launch_notify.sql` — schema migration (DMPL-02 prerequisite; without it, `useDmLaunchNotify` test has nothing to hit)
- [ ] `packages/supabase/migrations/<timestamp>_delete_account_rpc.sql` — plpgsql `delete_account(uuid)` function (D-37 prerequisite)
- [ ] `packages/supabase/migrations/20260422000004_phase7_delete_account_smoke.sql` — plpgsql `wv_test_delete_account_smoke()` helper function for SQL smoke test (D-37 test prerequisite, local-only guard)

---

## Manual-Only Verifications

Phase 7 is the launch gate — several verifications can only be asserted on real devices / real stores / real production infra. These are logged in VERIFICATION.md and must be green before `/gsd-ship`.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login snapshot (Apple prominence) — test file UPDATE | D-32 / T-7-07 | Test file already exists; no Wave 0 stub applicable. Updating an existing snapshot file requires touching login.tsx + test in Plan 07-01 Task 7 (Wave 2). Phase gate re-runs it in Plan 07-03 Task 3. | After Plan 07-01 Task 7: `cd apps/mobile && pnpm test tests/auth/login-snapshot.test.tsx` must exit 0; Plan 07-03 Task 3 re-runs it as the pre-submission gate |
| Real-device push notification delivery (Phase 4 carry-over) | D-33 launch gate | Expo Push + APNs/FCM cannot be simulated | Install production EAS build on iPhone + Pixel, send test notification via Expo Push API, confirm delivery |
| Apple Sign-In with Hide My Email relay | D-32 | Requires real Apple ID + Apple servers | Sign in with Hide My Email option, confirm profile created, confirm logout + re-login works |
| iOS TestFlight install → 5-tab smoke | D-33, D-34 | Pre-submission sanity | Internal TestFlight → install → 5 탭 전환 · 커뮤니티 진입 · 프로필 편집 · 글/댓글 작성 · 언어 변경 · 로그아웃 |
| Delete account end-to-end on real device | D-37, Google Play DMA | Requires real auth session + real DB cascade | Create throwaway account → set profile → join community → post → delete via More tab → confirm relogin with same email creates fresh account |
| Production `/privacy` & `/terms` 200 | D-31 | Hosted page must be public before store submission | `curl -sf https://<cloudflare-pages-domain>/privacy` and `/terms` return 200 with KO + EN visible |
| App Store Connect metadata + screenshots submitted | D-30, D-34, D-35, D-36 | Manual submission process | ASC upload — 17+ rating form, screenshots per device class, privacy URL, support URL, ATT "Data Used to Track You" → No |
| Google Play Console metadata + Data Safety form | D-30, D-31, D-37 | Manual submission process | Play Console — IARC form → 17+, Data Safety form → matches app usage, privacy URL, in-app account deletion checklist |
| EAS production build env parity | D-33 | Only visible in EAS logs | Trigger `eas build --profile production --platform all`, confirm EXPO_PUBLIC_SUPABASE_URL points at prod, confirm OAuth redirect URIs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify block OR a Wave 0 dependency in this file
- [ ] Sampling continuity: no 3 consecutive tasks lack an automated verify command
- [ ] Wave 0 covers every ❌ W0 reference in the map above
- [ ] No watch-mode flags anywhere (`--watch`, `-w`, `--ui`)
- [ ] Feedback latency < 30s (quick) / 60s (full)
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0 tests are committed

**Approval:** pending
