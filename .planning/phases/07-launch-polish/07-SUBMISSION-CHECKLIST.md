# Phase 7 Launch Submission Checklist

**Generated:** 2026-04-22 (Plan 07-03 Task 7, CODE+DOCS-ONLY scope)
**Status:** STRUCTURE READY — waiting on developer to execute manual steps from `07-03-MANUAL-FOLLOWUP.md` and tick boxes below as each lands.

This file is a living document. Update each `pending` cell to `pass` (with evidence) or `fail` (with blocker description) as the manual cutover and submission progress.

---

## Production Infrastructure

| Item | Value |
|------|-------|
| Production Supabase project ref | `<TBD — see MANUAL-FOLLOWUP step 2.1>` |
| Production Supabase URL | `https://<TBD>.supabase.co` |
| Admin public domain | `<TBD — see MANUAL-FOLLOWUP step 1.4>` (default: `https://wecord-docs.pages.dev`) |
| Privacy URL | `<ADMIN_DOMAIN>/privacy` |
| Terms URL | `<ADMIN_DOMAIN>/terms` |
| Account Deletion URL (web) | `<ADMIN_DOMAIN>/account-delete-request` |
| Support URL | `<ADMIN_DOMAIN>/support` (REVIEW HIGH — replaces previous mailto-only Support URL) |
| Branded domain decision | `<TBD>` — pages.dev (default) **OR** custom domain (e.g. `wecord.app` → CNAME → pages.dev). REVIEW MEDIUM: custom domain strongly recommended pre-submission to reduce reviewer friction. If deferred, log here as "pages.dev default; custom domain deferred to v1.0.1" — do NOT leave blank. |
| EAS production env (EXPO_PUBLIC_SUPABASE_URL) | `<TBD — set via eas env:create>` |
| EAS production env (EXPO_PUBLIC_SUPABASE_ANON_KEY) | `<TBD — set via eas env:create>` |

---

## App Store Connect — metadata

- [ ] App name: Wecord
- [ ] Subtitle (≤30): _developer copy_
- [ ] Primary category: Social Networking
- [ ] Secondary category: Entertainment
- [ ] Age rating: 17+ (answer content questionnaire — mature themes = yes)
- [ ] Privacy Policy URL: _from Production Infrastructure table_
- [ ] Support URL: _from Production Infrastructure table_ — MUST be the `/support` page, NOT mailto
- [ ] Version: 1.0.0
- [ ] Copyright: © 2026 Wecord
- [ ] App Review information: contact name + phone + email + demo-account instructions.
  - **Recommended path** (pick ONE — REVIEW UPDATE — Codex MEDIUM): create `review+demo@wecord.app` (or equivalent) as a dedicated reviewer demo account. Pre-seed: 2 joined communities (one solo + one group), 1 recent post + 1 comment, notification preferences enabled, Apple/Google link present, 17+ age gate passed. Reviewer note text:
    > Sign in with `review+demo@wecord.app` (password supplied in Contact field). Account is pre-populated so you can immediately exercise the feed, notifications, report flow, and delete-account path. Hide My Email relay also supported if you prefer your own Apple ID.
  - **Fallback path** (only if demo account is impractical):
    > This app uses Google/Apple OAuth only. Reviewer: please sign in with your own Apple ID or Hide My Email relay — fully supported. Onboarding wizard auto-creates a profile. Sample communities visible immediately.
  - MUST NOT ship both messages simultaneously. Pick one and remove the other before submission.
- [ ] Account Deletion field: "In-app path: More → Settings → Delete account (3-step DELETE typing confirmation). Web path: `<ADMIN_DOMAIN>/account-delete-request`."
- [ ] App Privacy → Data Types Collected: Name, Email, Photos/Videos, User Content, Device ID, Usage Data
- [ ] App Privacy → Tracking: "Data NOT used to track you" (ALL items) — ATT compliance per D-36
- [ ] Screenshots (per localization KO + EN):
  - [ ] iPhone 6.9" (1290×2796) — 5+ images
  - [ ] iPhone 6.5" optional
  - [ ] iPad 13" required (supportsTablet=true)
- [ ] Description (KO + EN, ≤4000 chars)
- [ ] Promotional text (KO + EN, ≤170 chars)
- [ ] Keywords (KO + EN, ≤100 chars)
- [ ] Pricing: Free, Worldwide

---

## Google Play Console — metadata

- [ ] App name (≤50)
- [ ] Short description (≤80)
- [ ] Full description (≤4000)
- [ ] App icon 512×512 PNG
- [ ] Feature graphic 1024×500
- [ ] Phone screenshots (2–8, 1080×1920+)
- [ ] Content rating: IARC → 17+ (mature themes)
- [ ] Target audience: 18+
- [ ] Ads: No ads declaration
- [ ] Data Safety → deletion URL: `<ADMIN_DOMAIN>/account-delete-request`
- [ ] Data Safety → Can users delete their data? → "Yes, users can request data deletion"
- [ ] Data Safety → Collection: match Apple list above
- [ ] Support URL field: `<ADMIN_DOMAIN>/support`
- [ ] App access → reviewer instructions (OAuth-only note, same demo path as App Store)

---

## Apple Guideline 1.2 Checklist — UGC / Social App  [REVIEW HIGH]

Final evidence is in `.planning/phases/07-launch-polish/07-UGC-COMPLIANCE-EVIDENCE.md`. Summary:

| # | Item | State | Evidence |
|---|------|-------|----------|
| 1 | Objectionable content filter (banned words + automated moderation) | pass | `packages/supabase/functions/moderate/index.ts` (banned-word lookup + OpenAI Moderation API) + `banned_words` table migration `20260322100000_phase6_soft_delete_banned_words.sql` — see UGC-COMPLIANCE-EVIDENCE.md (a) |
| 2 | User-facing report mechanism on posts + comments + replies | pass | `apps/mobile/components/report/ReportBottomSheet.tsx` + `apps/mobile/hooks/report/useReport.ts` (5 reasons: hate/spam/violence/copyright/other) wired into `PostCard.tsx` (onReport prop), `CommentRow.tsx`, `ReplyRow.tsx`, `(community)/[id]/post/[postId].tsx` |
| 3 | Admin triage + graduated sanctions (warning → 7d → 30d → permanent) | pass | `apps/admin/app/(dashboard)/moderation/page.tsx` + `user_sanctions` table (initial schema + Phase 6-05) |
| 4 | User blocking OR community-level moderation justification | pass_with_justification | Per-user block deferred to v1.1. Justification: leave-community (Phase 3 `useLeaveCommunity`) + per-community moderation (Phase 6-05 admin dashboard) + graduated sanctions (warning/7d/30d/permanent on `user_sanctions.type`) form the equivalent isolation control. See UGC-COMPLIANCE-EVIDENCE.md (c). |
| 5 | Published operator contact (web, not mailto-only) | pass | `<ADMIN_DOMAIN>/support` page deployed via 07-03 Task 1 — visible mailto + escalation note "1–3 business days" + FAQ |
| 6 | Moderation latency SLA documented | pass | Privacy + Support pages commit to "1–3 business days for report review" — same string in `apps/admin/lib/legal-content.ts` SUPPORT_KO/EN |

---

## Apple Guideline 4.8 Checklist — Login Services

| # | Item | State | Evidence |
|---|------|-------|----------|
| 1 | Google OAuth present AND Apple Sign-In present | pass | `apps/mobile/app/(auth)/login.tsx` (Phase 2) |
| 2 | Apple button equivalent prominence (same size, at-or-above) | pass | `apps/mobile/tests/auth/login-snapshot.test.ts` (T-7-07 — Plan 07-01 Task 7); re-run pre-submission per 07-03-MANUAL-FOLLOWUP.md step 3 |
| 3 | Apple button HIG style (white-on-dark for dark theme) | pending | manual screenshot review at TestFlight |
| 4 | Hide My Email relay supported | pending | TestFlight real-device test |
| 5 | In-app account deletion path exists (≤3 taps) | pass | `apps/mobile/app/(more)/delete-account/{warning,confirm,processing}.tsx` + Settings row destructive group (Plan 07-02 Task 5) — Home → More → Settings → Delete account = 3 taps |
| 6 | Privacy Policy URL in App Store Connect | pending | submission step (uses `<ADMIN_DOMAIN>/privacy`) |
| 7 | Account Deletion field in App Store Connect | pending | submission step |
| 8 | Apple Sign-In users can log out in-app | pass | `apps/mobile/app/(tabs)/more.tsx` Log Out destructive row (Plan 07-01 Task 3) |
| 9 | OAuth flow passes ToS/Privacy agreement | pass | Phase 2 AUTH-05 |
| 10 | No data collection beyond name/email without explicit consent | pass | Phase 2 AUTH-08 dateOfBirth consent |

---

## Google Play DMA — In-App Account Deletion Checklist

| # | Item | State |
|---|------|-------|
| 1 | In-app deletion path present ≤3 taps | pass (More → Settings → Delete account) |
| 2 | Deletion cascades user-owned data | pass — `delete_account` RPC tested locally via `wv_test_delete_account_smoke()`; production verification deferred to 07-03-MANUAL-FOLLOWUP.md step 5.4 |
| 3 | Web deletion request path exists | pass — `<ADMIN_DOMAIN>/account-delete-request` shipped in 07-03 Task 1 |
| 4 | Data Safety form declares deletion | pending (Console submission) |
| 5 | Data Safety matches actual collection | pending (Console submission) |
| 6 | Deletion URL publicly reachable | pending — verify via curl after Cloudflare deploy (07-03-MANUAL-FOLLOWUP.md step 1.5) |

---

## T-7-* Final Threat Audit

All threat IDs T-7-01 through T-7-07 carry forward from Plans 07-01 / 07-02. Plan 07-03 adds the FINAL verification pointers below.

| Threat ID | Mitigation Location | Verification |
|-----------|---------------------|--------------|
| T-7-01 Shop WebView hijack | `apps/mobile/components/shop/ShopWebView.tsx` + `isAllowedHost.ts` (https-only + x-square.kr exact/subdomain) | `apps/mobile/tests/shop/external-link-block.test.ts` (12 cases) |
| T-7-02 Account delete escalation | `packages/supabase/functions/delete-user/index.ts` (JWT-only user.id) + `delete_account` RPC (SECURITY DEFINER, service_role-only EXECUTE) | `packages/supabase/functions/delete-user/index.test.ts` + `apps/mobile/tests/account/useDeleteAccount.test.ts` |
| T-7-03 Profile update spoofing | `apps/mobile/hooks/profile/useUpdateProfile.ts` (`.eq('user_id', user.id)`) + RLS `profiles_update_own` | `apps/mobile/tests/profile/useUpdateProfile.test.ts` |
| T-7-04 Avatar DoS | avatars bucket (2 MB cap + JPEG/PNG/WEBP allowlist + 4 RLS policies) + client guard | `apps/mobile/tests/profile/useUploadAvatar.test.ts` + `packages/supabase/migrations/20260422000006_phase7_avatars_bucket.sql` |
| T-7-05 Stale session | `apps/mobile/stores/authStore.ts` (`signOut` try/finally + onSignOut callback) + `_layout.tsx` queryClient.clear registration | `apps/mobile/tests/auth/signOut.test.ts` + `signOut-queryclient-integration.test.ts` |
| T-7-06 DM notify RLS bypass | RLS `profiles_update_own` + `useDmLaunchNotify` `.eq('user_id', user.id)` filter + Pitfall 10 short-circuit | `apps/mobile/tests/dm/useDmLaunchNotify.test.ts` |
| T-7-07 Apple prominence | Apple button rendered above Google in `(auth)/login.tsx` | `apps/mobile/tests/auth/login-snapshot.test.ts` |

---

## Dependencies for submission task

- [ ] Cloudflare Pages deploy returned 200 for all 4 public routes (07-03-MANUAL-FOLLOWUP.md step 1)
- [ ] Production Supabase project created (step 2)
- [ ] PROD_REF exported + migration list dry-run confirmed (step 3)
- [ ] db push + secrets set + DB schema verified via psql (step 4)
- [ ] 7 Edge Functions deployed + delete-user 401 smoke confirmed (step 5)
- [ ] OAuth providers enabled in Supabase + redirect URIs registered in Google + Apple consoles (step 6)
- [ ] EAS env vars set + production build succeeds (step 7)
- [ ] TestFlight 9-item smoke test passes (step 8)
- [ ] App Store Connect + Play Console metadata filled per sections above (step 9)
- [ ] Login snapshot test re-run green (step 3 of MANUAL-FOLLOWUP, automated)

---

## Closing checklist before final "Submit for Review"

- [ ] All `pending` cells in this file resolved to `pass` or documented `fail`
- [ ] `07-UGC-COMPLIANCE-EVIDENCE.md` overall audit = PASS
- [ ] `07-VALIDATION.md` frontmatter `nyquist_compliant: true` flipped (after final pre-submission `pnpm test:ci` exit 0)
- [ ] `07-03-MANUAL-FOLLOWUP.md` every step's "Status" column updated to "Done <date>" or "Deferred to v1.0.1 <reason>"
