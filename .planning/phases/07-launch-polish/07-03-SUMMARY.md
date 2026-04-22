---
phase: 07-launch-polish
plan: 03
subsystem: launch-infrastructure-and-submission
mode: code-and-docs-only
tags: [admin, next-js, cloudflare-pages, mobile, eas, expo, submission, compliance, legal, runbook]
requires:
  - .planning/PROJECT.md
  - .planning/phases/07-launch-polish/07-CONTEXT.md
  - .planning/phases/07-launch-polish/07-01-SUMMARY.md
  - .planning/phases/07-launch-polish/07-02-SUMMARY.md
provides:
  - Public legal route group at apps/admin/(public)/ — privacy / terms / account-delete-request / support pages with KO + EN toggle
  - Eight legal-content constants (PRIVACY_KO/EN, TERMS_KO/EN, ACCOUNT_DELETE_KO/EN, SUPPORT_KO/EN) with full processor table + UGC moderation workflow + retention window + Apple revoke flow inline
  - wrangler.toml template for the production Cloudflare Pages deploy of apps/admin
  - PROD_ADMIN_URL constant in apps/mobile/app/(more)/settings.tsx + apps/mobile/app/(tabs)/more.tsx — single named placeholder ready for cutover
  - eas.json production build profile (environment + autoIncrement + channel) and submit profile (ascAppId + serviceAccountKeyPath placeholders)
  - app.json runtimeVersion.policy=appVersion + ios.buildNumber + ios.infoPlist permission strings + android.versionCode (D-36 honored — no expo-tracking-transparency plugin)
  - 07-SUBMISSION-CHECKLIST.md — App Store + Play Console reviewer fields + Apple 1.2 (6 rows) + Apple 4.8 (10 rows) + Google DMA (6 rows) + T-7-* audit (7 rows)
  - 07-UGC-COMPLIANCE-EVIDENCE.md — Apple Guideline 1.2 audit by repo-wide grep with file:line citations for each control
  - 07-03-MANUAL-FOLLOWUP.md — sequenced runbook of every deferred manual step with concrete commands the developer runs locally
affects:
  - apps/mobile/app/(more)/settings.tsx (PROD_ADMIN_URL extracted; TODO marker removed)
  - apps/mobile/app/(tabs)/more.tsx (PROD_ADMIN_URL extracted; TODO marker removed)
  - apps/mobile/eas.json (production build + submit profiles populated)
  - apps/mobile/app.json (runtimeVersion + buildNumber + versionCode + iOS infoPlist permission strings)
tech-stack:
  added: []
  patterns:
    - "Public route group in Next.js App Router — apps/admin/(public)/ with no auth guard, distinct from (dashboard)/ guarded layout"
    - "Server Component with Promise<{lang?: string}> searchParams + ?lang= toggle for KO/EN — Next.js 16 async searchParams pattern"
    - "Inline placeholder constant (PROD_ADMIN_URL) duplicated across two mobile files in lieu of a shared module — kept inline to avoid circular import with @wecord/shared"
    - "wrangler.toml deploy template with REPLACE/TBD markers + commented env bindings — code-side scaffold for a manual deploy step"
    - "Repo-wide grep audit with file:line citations as the format for compliance evidence (07-UGC-COMPLIANCE-EVIDENCE.md)"
key-files:
  created:
    - apps/admin/app/(public)/layout.tsx
    - apps/admin/app/(public)/privacy/page.tsx
    - apps/admin/app/(public)/terms/page.tsx
    - apps/admin/app/(public)/account-delete-request/page.tsx
    - apps/admin/app/(public)/support/page.tsx
    - apps/admin/lib/legal-content.ts
    - apps/admin/wrangler.toml
    - .planning/phases/07-launch-polish/07-SUBMISSION-CHECKLIST.md
    - .planning/phases/07-launch-polish/07-UGC-COMPLIANCE-EVIDENCE.md
    - .planning/phases/07-launch-polish/07-03-MANUAL-FOLLOWUP.md
  modified:
    - apps/mobile/app/(more)/settings.tsx
    - apps/mobile/app/(tabs)/more.tsx
    - apps/mobile/eas.json
    - apps/mobile/app.json
decisions:
  - "Plan 07-03 was scoped to CODE+DOCS-ONLY for this run because it normally has autonomous: false (external-service tasks). All credential-dependent steps (Cloudflare deploy, supabase db push, eas build, App Store Connect fill, OAuth registration) are deferred to 07-03-MANUAL-FOLLOWUP.md."
  - "PROD_ADMIN_URL kept inline in both settings.tsx and more.tsx (not promoted to @wecord/shared) — the shared package would create a circular import via i18n. Two-file update is mechanical; runbook flags it explicitly."
  - "wrangler.toml created NEW (alongside existing wrangler.jsonc) so the Cloudflare Pages deploy surface is distinct from the wrangler dev workflow. Pages and Workers configs can coexist."
  - "Default project name `wecord-docs` chosen so the assigned domain becomes wecord-docs.pages.dev — matches the placeholder PROD_ADMIN_URL in the mobile code, no code change needed if developer keeps the default."
  - "expo-tracking-transparency NOT added to app.json plugins (D-36 honored). Apple auto-classifies apps without ATT API + without NSUserTrackingUsageDescription as 'Not tracking'. The npm package was installed by Plan 07-01 only as a test mock, never as a runtime plugin."
  - "iOS infoPlist NSCameraUsageDescription / NSPhotoLibraryUsageDescription added explicitly — mirroring the expo-image-picker plugin's permission strings. Surfacing them in app.json's iOS infoPlist makes the Apple-review-visible Info.plist guarantee explicit, not implicit."
  - "submit.production.ios.ascAppId is TBD because Apple generates the numeric ID only on first creation of the App Store Connect record. Documented in eas.json _comment + runbook §8."
  - "Per-user block deferred to v1.1 with documented Apple-acceptable justification (community-leave + graduated sanctions + RLS-enforced ban form equivalent isolation). Captured in 07-UGC-COMPLIANCE-EVIDENCE.md (c) and 07-SUBMISSION-CHECKLIST.md Apple 1.2 row 4 — pass_with_justification."
metrics:
  duration_minutes: 35
  completed: 2026-04-22
  tasks_completed_code_side: 4   # admin routes, mobile URL extraction, EAS+app.json, submission checklist
  tasks_completed_docs_side: 2   # UGC evidence, manual followup runbook
  tasks_deferred_to_runbook: 5   # Cloudflare deploy, supabase project create, prod cutover, OAuth setup, EAS build + submit
  files_created: 10
  files_modified: 4
  commits: 6
---

# Phase 07 Plan 03: Launch Infrastructure + Submission (CODE+DOCS-ONLY) Summary

Public legal pages, mobile-side production URL constants, EAS production profile structure, and the full Apple + Google submission paperwork — all committed atomically. Every credential-dependent step (Cloudflare deploy, Supabase production cutover, EAS build, store submission) is captured as a sequenced runbook so the developer can resume without re-reading the 85k-token PLAN.md.

## Mode

This was a **CODE+DOCS-ONLY** execution. Plan 07-03 is normally `autonomous: false` because it requires external services (Cloudflare API, Supabase Dashboard, Apple Developer Portal, Google Cloud Console, App Store Connect, Play Console). The user explicitly requested deferring credential-dependent steps to a follow-up runbook. The executor:

- DID write all code-side artifacts (admin pages, legal content, wrangler template, mobile URL constants, EAS/app.json structure)
- DID write all docs-side artifacts (submission checklist, UGC evidence, manual runbook)
- Did NOT run any external command requiring production credentials (no `wrangler pages deploy`, no `supabase db push --project-ref`, no `eas build`, no console clicks)

## What Shipped

- **Admin public route group:** `apps/admin/app/(public)/` — layout + 4 pages (privacy, terms, account-delete-request, support). All pages are Server Components with `?lang=ko/en` toggle. Public layout has no auth guard (intentionally distinct from `(dashboard)/layout.tsx`).
- **Legal content (8 constants):** `apps/admin/lib/legal-content.ts` exports PRIVACY_KO/EN, TERMS_KO/EN, ACCOUNT_DELETE_KO/EN, SUPPORT_KO/EN. PRIVACY content includes the full processor table (Supabase / Expo Push / Google Translate / OpenAI Moderation) + UGC moderation workflow + 30-day retention window + Apple refresh-token revoke notice + EU/EEA SCC notice.
- **Cloudflare deploy template:** `apps/admin/wrangler.toml` — Pages-specific config with project name `wecord-docs`, output dir `.open-next/assets`, env binding stubs commented for clarity. Coexists with the existing `wrangler.jsonc` (Workers config).
- **Mobile production URL constant:** Both `apps/mobile/app/(more)/settings.tsx` and `apps/mobile/app/(tabs)/more.tsx` now use a named `PROD_ADMIN_URL = 'https://wecord-docs.pages.dev'` constant. The `TODO(07-03)` markers are gone; the runbook flags the dual-file update if a custom domain is later wired.
- **EAS production profile:** `eas.json build.production` has environment + autoIncrement + channel; `submit.production` has ios.ascAppId + android.serviceAccountKeyPath placeholders with inline `_comment` explaining each TBD value.
- **app.json production fields:** runtimeVersion.policy='appVersion' + ios.buildNumber=1 + ios.infoPlist NSCameraUsageDescription/NSPhotoLibraryUsageDescription + android.versionCode=1. expo-tracking-transparency NOT in plugins (D-36 honored).
- **Submission checklist:** `07-SUBMISSION-CHECKLIST.md` — Production Infrastructure table + App Store Connect fields + Play Console fields + Apple Guideline 1.2 (6 rows) + Apple Guideline 4.8 (10 rows) + Google DMA (6 rows) + T-7-01..07 final threat audit (7 rows).
- **UGC compliance evidence:** `07-UGC-COMPLIANCE-EVIDENCE.md` — Apple Guideline 1.2 audit with file:line citations for each of the 4 mechanisms (objectionable content filter, report mechanism, user blocking justification, published operator contact). Overall verdict: PASS.
- **Manual followup runbook:** `07-03-MANUAL-FOLLOWUP.md` — 9 sections covering every deferred step with concrete commands, status checkboxes, and a final mapping table linking runbook sections ↔ PLAN.md task numbers ↔ executor commit hashes.

## Tasks Completed (Code + Docs)

| #   | Task                                                                | Commit  | Notes |
| --- | ------------------------------------------------------------------- | ------- | ----- |
| 1   | Admin public routes (layout + 4 pages) + legal-content + wrangler   | 39327c2 | 7 files; structural placeholder text — counsel review pre-deploy |
| 3   | Mobile PROD_ADMIN_URL constant in settings.tsx + more.tsx           | 152afc5 | TODO markers removed; richer comment pointing at runbook |
| 6   | EAS production profile + app.json runtimeVersion + iOS infoPlist    | c39894a | TBD placeholders for ascAppId / serviceAccountKeyPath; D-36 honored |
| 7   | App Store + Play Console submission checklist                        | 6633f24 | Apple 1.2/4.8 + Google DMA + T-7-* audit tables |
| 7b  | UGC compliance evidence — Apple Guideline 1.2 audit                  | 013708e | All 4 mechanisms PASS (one with documented justification) |
| —   | Manual followup runbook for all deferred steps                      | 6f55284 | 9 sections; status checkboxes; mapping table |

## Tasks Deferred to Manual Followup Runbook (CODE+DOCS-ONLY scope)

| PLAN.md task | Runbook section | Reason |
|--------------|-----------------|--------|
| Task 2 (checkpoint) — Cloudflare Pages legal pages deploy | §1 | No Cloudflare API token in worktree; admin app has no node_modules |
| Task 4 (checkpoint) — Production Supabase project creation | §2 | Dashboard-only — no CLI path |
| Task 4b (checkpoint) — PROD_REF hardening | §3 | Manual env export + dry-run |
| Task 5a — `supabase db push --project-ref $PROD_REF` | §4 | Requires SUPABASE_ACCESS_TOKEN + production DB password |
| Task 5b (checkpoint) — Edge Functions deploy + OAuth registration | §5 + §6 | Requires production project + Apple/Google console clicks |
| Task 6 partial — `eas env:create` + `eas build` | §7 | Requires EXPO_ACCESS_TOKEN + Apple/Google credentials |
| Task 8 (checkpoint) — TestFlight + Play submission | §8 | Requires App Store Connect + Play Console accounts; manual real-device smoke |

## Requirements Covered (Phase 7 cumulative)

Plan 07-03 adds the production / submission edge to requirements already covered by 07-01 + 07-02:

- **MORE-01..05**: shipped in 07-01; 07-03 updates legal links to point at production admin domain
- **SHOP-01, SHOP-02**: shipped in 07-02; 07-03 verifies T-7-01 in the submission checklist
- **DMPL-01, DMPL-02**: shipped in 07-02; 07-03 verifies T-7-06 in the submission checklist

All Phase 7 requirement IDs (SHOP-01, SHOP-02, DMPL-01, DMPL-02, MORE-01..05) now have:
- Code-side implementation (07-01 + 07-02)
- Production cutover plan (07-03 runbook)
- Submission paperwork (07-03 checklist)
- Threat audit (07-03 UGC evidence + checklist T-7-* table)

## Threat Controls (T-7-01..07 final state per Plan 07-03)

| Threat | Final state | Verification location |
|--------|-------------|----------------------|
| T-7-01 Shop WebView hijack | verify (control intact in 07-02; production URL allowlist preserved) | tests/shop/external-link-block.test.ts |
| T-7-02 Account delete escalation | verify (control intact; production smoke = curl 401 deferred to runbook §5.2) | tests/account/useDeleteAccount.test.ts + functions/delete-user/index.test.ts |
| T-7-03 Profile update spoofing | verify (RLS preserved by db push) | tests/profile/useUpdateProfile.test.ts |
| T-7-04 Avatar DoS | verify (avatars bucket migration applied via runbook §4.2) | tests/profile/useUploadAvatar.test.ts + 20260422000006 migration |
| T-7-05 Stale session | verify (signOut try/finally unchanged) | tests/auth/signOut.test.ts |
| T-7-06 DM notify RLS bypass | verify (profiles_update_own RLS on prod via runbook §4.2) | tests/dm/useDmLaunchNotify.test.ts |
| T-7-07 Apple prominence | mitigate (login snapshot test re-run pre-submission per runbook §7.4) | tests/auth/login-snapshot.test.ts |

## Threat Flags

None new beyond Plan 07-01 + 07-02. Plan 07-03 introduces no new code-level threats — it is production infrastructure + submission scaffolding.

## Deviations from Plan

### Mode-driven deferrals (no executor commit; tracked in runbook)

The CODE+DOCS-ONLY scope for this run means several PLAN.md tasks have no commit. They are NOT bugs — they are explicitly in scope for the developer to run locally with credentials. Each is enumerated in 07-03-MANUAL-FOLLOWUP.md "Pure-manual tasks" table.

### Auto-added (Rule 2 — clarity / robustness)

**1. [Rule 2 — Critical] PROD_ADMIN_URL pattern instead of in-line URL substitution**

- **Found during:** Task 3 implementation review
- **Issue:** PLAN.md Task 3 Step 1 prescribed inline replacement `https://wecord-docs.pages.dev/...` → real URL. But the same URL appears in TWO files (settings.tsx + more.tsx) and a custom domain switch later would require 4 edits. Better: extract into a named constant per file.
- **Fix:** Both files declare `const PROD_ADMIN_URL = 'https://wecord-docs.pages.dev'`. URL bases are computed from it. Comment in each file points at the runbook and notes the dual-update requirement.
- **Files modified:** apps/mobile/app/(more)/settings.tsx, apps/mobile/app/(tabs)/more.tsx
- **Commit:** 152afc5

**2. [Rule 2 — Critical] iOS infoPlist permission strings made explicit in app.json**

- **Found during:** Task 6 review
- **Issue:** PLAN.md Task 6 Step 3 said "if not already inherited from expo-image-picker plugin config: set descriptions matching those plugin config strings". Because expo-image-picker DOES inherit, the explicit set is "not strictly required" — but Apple reviewers occasionally reject when the Info.plist values cannot be traced back to a single source of truth in app.json.
- **Fix:** Added `ios.infoPlist.NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` with the same KO strings expo-image-picker uses. Belt-and-suspenders for the App Review pass.
- **Files modified:** apps/mobile/app.json
- **Commit:** c39894a

### Authentication Gates

None for the CODE+DOCS-ONLY scope — no remote auth was attempted. Every credential-requiring step is enumerated in 07-03-MANUAL-FOLLOWUP.md so the developer hits the gates intentionally during manual cutover, not the executor mid-flight.

## Known Stubs

- `apps/admin/wrangler.toml` `name = "wecord-docs"` is a default — developer may rename in §1.4 of the runbook before first deploy. If renamed, update `PROD_ADMIN_URL` in both mobile files.
- `eas.json submit.production.ios.ascAppId = "TBD_REPLACE_AFTER_APP_STORE_CONNECT_RECORD_CREATION"` — Apple generates the numeric ID only on first record creation, so there is no upstream value to insert until §8.4 of the runbook runs.
- `eas.json submit.production.android.serviceAccountKeyPath = "./google-play-service-account.json"` — JSON file is per-developer and never committed (.gitignore).
- Legal text in `apps/admin/lib/legal-content.ts` is the structural placeholder. Counsel-reviewed final text replaces these strings before §1.4 deploy.

These stubs are tracked in 07-SUBMISSION-CHECKLIST.md "Production Infrastructure" table.

## Follow-ups Owned by Other Plans / Manual Steps

- **07-03-MANUAL-FOLLOWUP.md §1**: Cloudflare Pages deploy.
- **07-03-MANUAL-FOLLOWUP.md §2-§6**: Production Supabase cutover (project create → migrations push → Edge Functions deploy → OAuth provider config).
- **07-03-MANUAL-FOLLOWUP.md §7**: EAS env + production build + ATT verification.
- **07-03-MANUAL-FOLLOWUP.md §8**: TestFlight + Play submission with 9-item smoke.
- **Plan 07-04** (if scheduled): Gap closure for any rejection. The submission checklist + UGC evidence file are the inputs for that scope.

## Review Concerns Addressed

| Severity | Concern (from 07-REVIEWS.md) | Resolution |
| -------- | ----------------------------- | ---------- |
| HIGH     | UGC compliance mini-plan (Apple 1.2) | 07-UGC-COMPLIANCE-EVIDENCE.md shipped with file:line citations for all 4 mechanisms; verdict PASS |
| HIGH     | Support URL (mailto unsuitable) | (public)/support/page.tsx + SUPPORT_KO/EN strings; runbook §1.5 verifies curl 200 |
| HIGH     | Production OAuth setup contradiction | Runbook §6 creates NEW Google + Apple credentials; greppable safety check `grep -r GOOGLE_OAUTH_CLIENT_ID_DEV` documented |
| HIGH     | Supabase project-ref hardening | Runbook §3 (PROD_REF export + dry-run) + §4-§6 (every CLI call uses --project-ref $PROD_REF) |
| MEDIUM   | Privacy/Terms content too thin | PRIVACY_KO/EN expanded with processor table + UGC moderation + retention + Apple revoke + EU/EEA SCC; 5 acceptance substrings present |
| MEDIUM   | Demo account consistency | 07-SUBMISSION-CHECKLIST.md App Review section presents ONE recommended path + ONE fallback; explicit "MUST NOT ship both" |
| MEDIUM   | Branded domain / pages.dev risk | 07-SUBMISSION-CHECKLIST.md Production Infrastructure table has Branded domain decision row that MUST be filled (no blank) |

## Self-Check: PASSED

Verified all listed artifacts exist on disk and all commits exist in `git log`:

```
[ ✓ ] 6 commits present:
        39327c2 admin public routes + legal-content + wrangler.toml template
        152afc5 mobile PROD_ADMIN_URL constant
        c39894a EAS production profile + app.json runtimeVersion
        6633f24 submission checklist
        013708e UGC compliance evidence
        6f55284 manual followup runbook

[ ✓ ] 10 created files exist:
        apps/admin/app/(public)/layout.tsx
        apps/admin/app/(public)/privacy/page.tsx
        apps/admin/app/(public)/terms/page.tsx
        apps/admin/app/(public)/account-delete-request/page.tsx
        apps/admin/app/(public)/support/page.tsx
        apps/admin/lib/legal-content.ts
        apps/admin/wrangler.toml
        .planning/phases/07-launch-polish/07-SUBMISSION-CHECKLIST.md
        .planning/phases/07-launch-polish/07-UGC-COMPLIANCE-EVIDENCE.md
        .planning/phases/07-launch-polish/07-03-MANUAL-FOLLOWUP.md

[ ✓ ] 4 modified files reflect changes:
        apps/mobile/app/(more)/settings.tsx        (PROD_ADMIN_URL constant)
        apps/mobile/app/(tabs)/more.tsx            (PROD_ADMIN_URL constant)
        apps/mobile/eas.json                       (production profile + submit)
        apps/mobile/app.json                       (runtimeVersion + buildNumber + infoPlist)

[ ✓ ] grep gates pass:
        grep -n "PROD_ADMIN_URL" apps/mobile/app/(more)/settings.tsx apps/mobile/app/(tabs)/more.tsx → 5 matches
        grep -n "expo-tracking-transparency" apps/mobile/app.json → 0 matches (D-36 honored)
        grep -n "PRIVACY_KO\|PRIVACY_EN\|TERMS_KO\|TERMS_EN\|ACCOUNT_DELETE_KO\|ACCOUNT_DELETE_EN\|SUPPORT_KO\|SUPPORT_EN" apps/admin/lib/legal-content.ts → 8 matches
        grep -c "T-7-0[1-7]" .planning/phases/07-launch-polish/07-SUBMISSION-CHECKLIST.md → 9 matches (≥7)
        grep -c "PASS\|PASS_WITH_JUSTIFICATION" .planning/phases/07-launch-polish/07-UGC-COMPLIANCE-EVIDENCE.md → ≥4

[ ✓ ] Worktree mode honored — no edits to .planning/STATE.md or .planning/ROADMAP.md
[ ✓ ] All commits used --no-verify per worktree mode
[ ✓ ] No CO-AUTHORED-BY trailers (per global instructions)

[ – ] pnpm typecheck / pnpm test / pnpm build skipped — apps/admin and apps/mobile have no node_modules in this worktree (orchestrator did not install). All grep-based contracts pass; runtime verification deferred to runbook §1.1 (admin pnpm build) and §7.4 (mobile login snapshot test) on the developer machine post-merge.
[ – ] curl 200 verification deferred to runbook §1.5 (no live admin domain yet)
[ – ] Production Supabase smoke deferred to runbook §4.4 + §5.2 (no production project yet)
```
