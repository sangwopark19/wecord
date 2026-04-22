# Phase 7 Plan 03 — Manual Followup Runbook

**Generated:** 2026-04-22
**Owner:** developer (sangwopark19@) — runs locally on a machine with full credentials
**Scope:** every step that 07-03-PLAN.md called for but the Plan 07-03 executor (CODE+DOCS-ONLY mode) deferred because it requires production credentials, browser console clicks, or tool access not available in the worktree.

This runbook is sequenced. Steps within a major section may run in parallel where noted, but section ordering is mandatory: you cannot register an OAuth redirect URI before the Supabase project exists, you cannot deploy Edge Functions before migrations are pushed, you cannot point the mobile app at production URLs before Cloudflare Pages returns 200.

Each step references the corresponding 07-03-PLAN.md task number so you can map runbook → plan.

---

## Pre-flight (one-time setup)

| Tool | Install | Auth |
|------|---------|------|
| Supabase CLI | `brew install supabase/tap/supabase` | `supabase login` (paste SUPABASE_ACCESS_TOKEN from dashboard) |
| Wrangler (Cloudflare) | `pnpm add -g wrangler` (or use `npx wrangler`) | `wrangler login` (browser flow) |
| EAS CLI | `pnpm add -g eas-cli` (or `npx eas-cli`) | `eas login` (paste EXPO_ACCESS_TOKEN or interactive) |
| psql | `brew install libpq && brew link --force libpq` | uses connection string per command |
| App Store Connect | (web only) | Apple ID with Developer Program membership |
| Play Console | (web only) | Google account with Play Console developer access |

**Credentials checklist (collect before you start; store in password manager):**

- [ ] Supabase: SUPABASE_ACCESS_TOKEN, plus production DB password (created during project provisioning)
- [ ] Cloudflare: account email + 2FA codes
- [ ] Google Cloud: project owner login (for production OAuth client creation)
- [ ] Apple Developer: account login + Team ID
- [ ] Expo: EXPO_ACCESS_TOKEN
- [ ] OpenAI: production API key (separate from dev)
- [ ] Google Translate API: production key

---

## Section 1 — Cloudflare Pages deploy of apps/admin (PLAN Task 1 + Task 2 checkpoint)

**Goal:** publicly serve `/privacy`, `/terms`, `/account-delete-request`, `/support` so Apple + Google reviewers can read them without auth.

### Step 1.1 — Local build sanity check
```bash
cd apps/admin
pnpm install                       # worktree had no node_modules; run from main after merge
pnpm build                         # next build → .open-next/assets via @opennextjs/cloudflare
```
Expect: `pnpm build` exits 0. If TypeScript errors surface in the (public)/ pages, fix before deploying.

### Step 1.2 — Local preview check
```bash
cd apps/admin
pnpm dev                           # http://localhost:3000
```
Visit each route in browser:
- http://localhost:3000/privacy , /privacy?lang=en
- http://localhost:3000/terms , /terms?lang=en
- http://localhost:3000/account-delete-request
- http://localhost:3000/support , /support?lang=en

Confirm KO/EN toggle works, page renders, processor table visible on /privacy, mailto link visible on /account-delete-request and /support.

### Step 1.3 — Review legal text with counsel
Phase 7 ships structural placeholder legal text. Before deploy:
- Replace company legal entity name + address inside `apps/admin/lib/legal-content.ts` (search for `Wecord` and `support@wecord.app`).
- Confirm processor list matches actual production deployment (Supabase region, OpenAI usage, Google Translate usage).
- If counsel wants additional sections (e.g., GDPR-specific addendum, Korean-PIPA-specific addendum), extend the constants in `legal-content.ts` and re-grep that the substrings `Supabase`, `Expo Push`, `Google Translate`, `OpenAI Moderation`, `account-delete-request` still appear in PRIVACY_KO and PRIVACY_EN (acceptance contract per Plan 07-03 Task 1 REVIEW UPDATE).

### Step 1.4 — Create Cloudflare Pages project + deploy
```bash
cd apps/admin
# First-time only: create project
wrangler pages project create wecord-docs \
  --production-branch=main \
  --compatibility-date=2024-09-23

# Build → deploy
pnpm build
wrangler pages deploy .open-next/assets --project-name=wecord-docs --branch=main
```

Expected output: deployment URL like `https://<hash>.wecord-docs.pages.dev` and the production alias `https://wecord-docs.pages.dev`.

**RECORD this URL** — it becomes `<ADMIN_DOMAIN>` in 07-SUBMISSION-CHECKLIST.md and replaces `PROD_ADMIN_URL` in `apps/mobile/app/(more)/settings.tsx` + `apps/mobile/app/(tabs)/more.tsx` (PLAN Task 3) IF the project name is anything other than `wecord-docs`. If you used `wecord-docs`, no code change needed — the placeholder already matches.

### Step 1.5 — Public verification (curl)
```bash
ADMIN=https://wecord-docs.pages.dev      # or your custom domain

curl -sfI $ADMIN/privacy | head -1                        # HTTP/2 200
curl -sfI $ADMIN/terms | head -1                          # HTTP/2 200
curl -sfI $ADMIN/account-delete-request | head -1         # HTTP/2 200
curl -sfI $ADMIN/support | head -1                        # HTTP/2 200 (REVIEW HIGH)

curl -s $ADMIN/privacy?lang=en | grep -c "Privacy Policy"  # >= 1
curl -s $ADMIN/privacy?lang=ko | grep -c "개인정보처리방침"  # >= 1
curl -s $ADMIN/support?lang=en | grep -c "Support"         # >= 1

# REVIEW UPDATE — Codex MEDIUM data map: PRIVACY MUST mention all 4 processors
curl -s "$ADMIN/privacy" | grep -c "Supabase"
curl -s "$ADMIN/privacy" | grep -c "Expo Push"
curl -s "$ADMIN/privacy" | grep -c "Google Translate"
curl -s "$ADMIN/privacy" | grep -c "OpenAI Moderation"
curl -s "$ADMIN/privacy" | grep -c "account-delete-request"
```
All four `grep -c` calls must return ≥ 1.

### Step 1.6 — (optional) Custom domain
Apple/Google reviewers respond better to a custom domain than `*.pages.dev`. If you own `wecord.app`:
1. In Cloudflare dashboard → Pages → wecord-docs → Custom Domains → `Set up a custom domain` → `wecord.app`.
2. Add the CNAME record at your DNS provider per Cloudflare's instructions.
3. Wait for propagation (5–60 min) and re-run Step 1.5 against `https://wecord.app`.
4. If you switch to a custom domain, update `PROD_ADMIN_URL` in BOTH:
   - `apps/mobile/app/(more)/settings.tsx`
   - `apps/mobile/app/(tabs)/more.tsx`
   In a single commit. Re-run `pnpm test:ci`.

### Step 1.7 — Update 07-SUBMISSION-CHECKLIST.md Production Infrastructure table
Fill the `<TBD>` cells: Admin public domain, Privacy URL, Terms URL, Account Deletion URL, Support URL. Set "Branded domain decision" to either the custom domain OR "pages.dev default; custom domain deferred to v1.0.1".

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>   ☐ Deferred — <reason>

---

## Section 2 — Production Supabase project creation (PLAN Task 4 checkpoint)

### Step 2.1 — Create project in Supabase Dashboard
1. https://supabase.com/dashboard/new
2. Organization: your Wecord org
3. Name: `wecord-prod` (or your preference)
4. Region: **ap-northeast-2 (Seoul)** — required by RESEARCH Runbook step 1
5. DB password: pick strong, save in password manager — needed for `supabase link`
6. Wait ~2 minutes for provisioning

### Step 2.2 — Collect API keys
Settings → API:
- Project URL: `https://<prod-ref>.supabase.co`
- `anon public` key — public, embedded in mobile bundle
- `service_role` key — SECRET, never in mobile, only in Supabase function secrets

### Step 2.3 — Enable required extensions
Database → Extensions:
- [ ] pgmq (Phase 4 push fan-out queue)
- [ ] pg_cron (Phase 4 scheduled jobs)
- [ ] pg_net (Phase 4 outbound HTTP from triggers)

### Step 2.4 — Update 07-SUBMISSION-CHECKLIST.md
Fill: Production Supabase project ref, Production Supabase URL.

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 3 — Project-ref hardening + dry-run (PLAN Task 4b checkpoint)

Every subsequent supabase CLI call uses `--project-ref $PROD_REF` explicitly. No implicit linked-project reliance.

### Step 3.1 — Export PROD_REF
```bash
supabase projects list                  # find your wecord-prod row
export PROD_REF=<prod-project-ref>
echo "Will target: $PROD_REF"
```

### Step 3.2 — Dry-run migration list (REVIEW UPDATE Codex HIGH)
```bash
cd packages/supabase
supabase migration list --project-ref $PROD_REF
```
Expect: every local migration timestamp appears in the "Local" column; the "Remote" column is mostly empty (production is fresh). If "Remote" has ANY timestamps, you are pointing at the wrong project — STOP and re-verify.

### Step 3.3 — Confirm api-keys host
```bash
supabase projects api-keys --project-ref $PROD_REF
```
Returned URL must match Step 2.2 project URL.

### Step 3.4 — Confirm no stale local config
```bash
cat packages/supabase/supabase/config.toml 2>/dev/null | grep -i "project_id\|project_ref" \
  || echo "no stale project_id in config — good"
```

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 4 — Production schema cutover (PLAN Task 5a)

### Step 4.1 — Link CLI to production
```bash
cd packages/supabase
supabase link --project-ref $PROD_REF       # enter DB password from Step 2.1
```

### Step 4.2 — Push all migrations
```bash
supabase db push --project-ref $PROD_REF
```
Confirm output lists ALL migrations including the Phase 7 set:
- `20260422000001_phase7_profile_dm_launch_notify.sql` (07-01)
- `20260422000006_phase7_avatars_bucket.sql` (07-02)
- `20260422000007_phase7_delete_account_rpc.sql` (07-02)
- `20260422000008_phase7_delete_account_deletion_inventory.md` (markdown — not applied as migration; documentation only)

The smoke helper `wv_test_delete_account_smoke` MUST NOT appear in `supabase migration list` output (it lives in `packages/supabase/tests/sql/`, not migrations/).

### Step 4.3 — Set DB-side function secrets
Create `packages/supabase/.env.prod` (it is in `.gitignore` already; verify):
```
OPENAI_API_KEY=<prod-openai-key>
GOOGLE_TRANSLATE_API_KEY=<prod-gtranslate-key>
EXPO_ACCESS_TOKEN=<prod-expo-token>
APPLE_TEAM_ID=<from Apple Developer Portal>
APPLE_KEY_ID=<APPLE_KEY_ID_PROD — see Section 6 below>
APPLE_SERVICES_ID=<APPLE_SERVICES_ID_PROD — see Section 6 below>
APPLE_PRIVATE_KEY=<contents of the .p8 file, single line, \n literal separators between PEM lines>
```

```bash
supabase secrets set --project-ref $PROD_REF --env-file ./.env.prod
rm -f packages/supabase/.env.prod                 # important: do not leave on disk
```

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` auto-set — do not set manually.

If APPLE_* credentials are not yet provisioned, skip them in this step. The Edge Function `delete-user/apple-revoke.ts` gracefully skips revocation when env vars are missing (Plan 07-02 design). Re-run `supabase secrets set` after Section 6 to add them.

### Step 4.4 — Verify production DB schema (read-only psql)
```bash
PROD_DB_URL="postgresql://postgres:<db-password>@db.$PROD_REF.supabase.co:5432/postgres"

psql "$PROD_DB_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='dm_launch_notify';"
# Expect: dm_launch_notify

psql "$PROD_DB_URL" -c "SELECT id FROM storage.buckets WHERE id='avatars';"
# Expect: avatars

psql "$PROD_DB_URL" -c "SELECT proname FROM pg_proc WHERE proname='delete_account';"
# Expect: delete_account

# Smoke helper MUST NOT exist in prod (per 07-02 review update — moved out of migrations/)
psql "$PROD_DB_URL" -c "SELECT proname FROM pg_proc WHERE proname='wv_test_delete_account_smoke';"
# Expect: 0 rows. If non-zero → DROP FUNCTION public.wv_test_delete_account_smoke; immediately.

# Confirm avatars UPDATE policy has WITH CHECK (closes rename/move bypass — 07-02 review update)
psql "$PROD_DB_URL" -c "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename='objects' AND policyname='avatars_update_own';"
# Expect: with_check column non-NULL.
```
Paste outputs into 07-03-SUMMARY.md "Cutover Outputs" section.

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 5 — Edge Functions deploy + smoke test (PLAN Task 5b)

### Step 5.1 — Deploy all 7 functions (every call uses --project-ref)
```bash
cd packages/supabase
supabase functions deploy generate-nickname --project-ref $PROD_REF
supabase functions deploy highlight         --project-ref $PROD_REF
supabase functions deploy home-feed         --project-ref $PROD_REF
supabase functions deploy moderate          --project-ref $PROD_REF
supabase functions deploy notify            --project-ref $PROD_REF
supabase functions deploy translate         --project-ref $PROD_REF
supabase functions deploy delete-user       --project-ref $PROD_REF
```
Each line: expect `Deployed Function ...`. If prompted for auth, run `supabase login` and retry.

### Step 5.2 — Production endpoint smoke
```bash
curl -i -X POST https://$PROD_REF.supabase.co/functions/v1/delete-user
# Expect: HTTP/2 401 (T-7-02 mitigation confirmed on production — no JWT, request rejected)

curl -i -X POST https://$PROD_REF.supabase.co/functions/v1/highlight
# Expect: HTTP/2 401 (endpoint reachable; auth guard intact)
```

### Step 5.3 — Record deploy outputs
Paste the 7 deploy lines + 2 curl HTTP status lines into 07-03-SUMMARY.md.

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 6 — Production OAuth setup (PLAN Task 5b — REVIEW HIGH)

CRITICAL: Production OAuth uses NEW credentials dedicated to prod. Do NOT reuse dev client IDs / dev Apple keys.

### Step 6.1 — Create NEW Google OAuth Web Client (production)
1. Google Cloud Console → APIs & Services → Credentials
2. + CREATE CREDENTIALS → OAuth client ID → Application type: Web application
3. Name: `wecord-prod-oauth`
4. Authorized redirect URI: `https://$PROD_REF.supabase.co/auth/v1/callback`
   (paste the PROD project ref ONLY — do NOT add the dev ref)
5. Save. Copy:
   - GOOGLE_OAUTH_CLIENT_ID_PROD
   - GOOGLE_OAUTH_CLIENT_SECRET_PROD

**Greppable safety check (REVIEW HIGH):**
```bash
grep -r "GOOGLE_OAUTH_CLIENT_ID_DEV\|<dev-client-id>" apps/ packages/
# Expect: empty. If matches found, abort cutover and remove dev client references first.
```

### Step 6.2 — Create NEW Apple Services ID + Sign in with Apple Key (production)
1. Apple Developer Portal → Identifiers → Services IDs
2. + → Services IDs → continue
3. Description: `Wecord Production`
4. Identifier: `com.wecord.app.signin.prod`
5. Enable: Sign In with Apple → Configure
6. Primary App ID: select your com.wecord.app App ID
7. Return URL: `https://$PROD_REF.supabase.co/auth/v1/callback` (production ref ONLY)
8. Save. Copy: APPLE_SERVICES_ID_PROD = `com.wecord.app.signin.prod`

Then create the new key:
1. Apple Developer Portal → Keys → +
2. Name: `Wecord Production Sign in with Apple`
3. Enable: Sign In with Apple → Configure → Primary App ID = production Services ID above
4. Continue → Register → Download `.p8` file (only available ONCE — save securely)
5. Copy the Key ID shown on the Key detail page → APPLE_KEY_ID_PROD
6. APPLE_TEAM_ID is on Apple Developer Portal → Membership

### Step 6.3 — Enable providers in Supabase Dashboard (production)
1. https://supabase.com/dashboard/project/$PROD_REF
2. Authentication → Providers
3. Google → Enable. Paste GOOGLE_OAUTH_CLIENT_ID_PROD + GOOGLE_OAUTH_CLIENT_SECRET_PROD.
4. Apple → Enable. Paste APPLE_SERVICES_ID_PROD + APPLE_TEAM_ID + APPLE_KEY_ID_PROD + APPLE_PRIVATE_KEY_PROD (paste contents of the `.p8` file).
5. Save.

**Re-run greppable safety check:**
```bash
grep -r "GOOGLE_OAUTH_CLIENT_ID_DEV\|APPLE_KEY_ID_DEV" apps/ packages/
# Expect: empty.
```

### Step 6.4 — Re-set Edge Function secrets with Apple credentials
If you skipped Apple secrets in Section 4 step 4.3, set them now:
```bash
cd packages/supabase
supabase secrets set --project-ref $PROD_REF \
  APPLE_TEAM_ID=$APPLE_TEAM_ID \
  APPLE_KEY_ID=$APPLE_KEY_ID_PROD \
  APPLE_SERVICES_ID=$APPLE_SERVICES_ID_PROD \
  APPLE_PRIVATE_KEY="$(cat AuthKey_${APPLE_KEY_ID_PROD}.p8)"
```

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 7 — EAS production env + production build (PLAN Task 6 + Task 8)

### Step 7.1 — Set EAS production env vars
```bash
cd apps/mobile
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://$PROD_REF.supabase.co --visibility plain
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <PROD_ANON_KEY> --visibility plain
```
If a var already exists, use `eas env:update` instead of `eas env:create`.

### Step 7.2 — Sanity check expo config
```bash
cd apps/mobile
npx expo config --type public 2>&1 | grep -E "bundleIdentifier|version|runtimeVersion"
```
Expect lines containing `com.wecord.app`, `1.0.0`, `appVersion`.

### Step 7.3 — Verify Info.plist absence of NSUserTrackingUsageDescription (D-36)
```bash
cd apps/mobile
npx expo prebuild --platform ios --no-install
grep -i "NSUserTrackingUsageDescription" ios/*/Info.plist
# Expect: NO match. If matched, ATT is leaking — remove and re-run.
rm -rf ios/ android/                 # clean — managed workflow uses EAS for native build
```

### Step 7.4 — Re-run Apple Sign-In snapshot test (T-7-07 lock)
```bash
cd apps/mobile
pnpm test tests/auth/login-snapshot.test.ts
```
Expect: pass. If fails, do NOT proceed to build — Apple Guideline 4.8 row 2 is broken.

### Step 7.5 — Production build
```bash
cd apps/mobile
eas build --profile production --platform all
```
EAS prompts for Apple credentials (App Store Connect login) and Android keystore on first run. Build runs ~20–45 min on EAS remote runners. Output: 1 .ipa + 1 .aab.

### Step 7.6 — Verify env parity in build
```bash
eas build:list --limit 1 --json | grep EXPO_PUBLIC_SUPABASE_URL
```
Confirm URL matches `https://$PROD_REF.supabase.co`.

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 8 — TestFlight + Play Console submission (PLAN Task 8)

### Step 8.1 — iOS submit + TestFlight
```bash
cd apps/mobile
eas submit --profile production --platform ios --latest
```
Wait for Apple processing (~10–30 min). Then in App Store Connect → TestFlight → invite yourself as internal tester → install on iPhone.

### Step 8.2 — TestFlight 9-item smoke (manual on real device)
- [ ] Sign in with Apple — try Hide My Email — profile created, re-login works
- [ ] 5-tab navigation visible; teal active state correct
- [ ] Profile edit — change nickname, upload avatar, save — verify persistence
- [ ] Language switch — immediate UI change
- [ ] Community → post → comment → like
- [ ] Receive push notification (Phase 4 carry-over) — send test via Expo Push API
- [ ] Shop tab loads x-square.kr; tap external link → opens in system browser
- [ ] DM tab Coming Soon → tap Notify Me → "Notified" state; re-tap → already-notified alert
- [ ] Delete account flow end-to-end → DELETE typing → confirm → return to login; re-login with same email creates fresh account (posts/comments soft-deleted with content=''; profile + memberships gone in psql)

Record pass/fail per item in 07-SUBMISSION-CHECKLIST.md and 07-03-SUMMARY.md.

### Step 8.3 — Android submit + Play internal testing
```bash
cd apps/mobile
eas submit --profile production --platform android --latest
```
First time: upload Google Play service account JSON key (Play Console → Setup → API access → create service account → download JSON). Update `eas.json submit.production.android.serviceAccountKeyPath` locally; do NOT commit the JSON. Repeat the 9-item smoke on an Android device.

### Step 8.4 — App Store Connect metadata
Fill every row of 07-SUBMISSION-CHECKLIST.md "App Store Connect — metadata". Pick ONE demo account path (recommended dedicated account OR fallback OAuth-only note — never both). Upload screenshots (KO + EN, 5+ images per locale). Submit for Review.

### Step 8.5 — Play Console metadata
Fill every row of 07-SUBMISSION-CHECKLIST.md "Google Play Console — metadata". Complete IARC questionnaire → 17+. Complete Data Safety form (declare deletion URL + collection types matching App Privacy). Submit to internal track first; promote to production after smoke.

### Step 8.6 — Update 07-VALIDATION.md
After `pnpm test:ci` exits 0 on the final pre-submission run, edit `.planning/phases/07-launch-polish/07-VALIDATION.md` frontmatter:
```yaml
nyquist_compliant: true
```
This unblocks the phase-gate sign-off section.

**Status:** ☐ Not started   ☐ In progress   ☐ Done <date>

---

## Section 9 — Post-submission monitoring

| Concern | Watch | Action |
|---------|-------|--------|
| Apple rejection (Guideline 1.2 UGC) | App Store Connect → Reviews | If rejected, re-read 07-UGC-COMPLIANCE-EVIDENCE.md, address gap, resubmit |
| Apple rejection (Guideline 4.8 OAuth) | App Store Connect → Reviews | Re-run login snapshot test; verify Hide My Email works on TestFlight |
| Apple rejection (account deletion path) | App Store Connect → Reviews | Confirm App Store Connect "Account Deletion field" is filled; verify in-app path is exactly 3 taps |
| Play rejection (Data Safety mismatch) | Play Console → Policy | Cross-check Data Safety answers vs actual data collection per 07-UGC-COMPLIANCE-EVIDENCE.md (a) processor list |
| Push notifications not arriving | Expo dashboard logs | Verify EXPO_ACCESS_TOKEN secret set in Section 4.3 |
| Apple revoke not firing on delete | Edge Function logs | Verify Section 6.4 secrets set; test by deleting an Apple-signed throwaway account |

---

## Pure-manual tasks (no code/doc deliverable from executor)

These tasks were 100% manual in 07-03-PLAN.md and are recorded here for completeness — no commit was made by the Plan 07-03 executor. Each maps to a section above:

| PLAN.md task | Plan task # | Status |
|--------------|-------------|--------|
| Cloudflare Pages legal pages deploy | Task 2 (checkpoint) | Section 1 |
| Production Supabase project creation | Task 4 (checkpoint) | Section 2 |
| PROD_REF hardening | Task 4b (checkpoint) | Section 3 |
| `supabase db push --project-ref $PROD_REF` | Task 5a (auto, but needs prod creds) | Section 4 |
| Edge Functions deploy + OAuth registration | Task 5b (checkpoint) | Sections 5 + 6 |
| EAS env + production build | Task 6 partial + Task 8 | Section 7 |
| App Store Connect / Play Console fill + Submit | Task 8 (checkpoint) | Section 8 |

---

## Mapping back to PLAN.md task numbers

| Runbook section | 07-03-PLAN.md task | Status of code-side artifact |
|-----------------|-------------------|------------------------------|
| §1 Cloudflare deploy | Task 1 + Task 2 checkpoint | code shipped (commit 39327c2) |
| §2 Supabase project create | Task 4 checkpoint | n/a — manual only |
| §3 PROD_REF hardening | Task 4b checkpoint | n/a — manual only |
| §4 Schema cutover | Task 5a | migrations exist (Plan 07-01 + 07-02); push deferred |
| §5 Edge Functions deploy | Task 5b | functions exist (Plan 07-01 + 07-02); deploy deferred |
| §6 OAuth providers | Task 5b | n/a — Apple Developer + Google Cloud Console clicks only |
| §7 EAS production build | Task 6 + Task 8 | eas.json + app.json shipped (commit c39894a); env + build deferred |
| §8 Store submission | Task 8 checkpoint | submission checklist + UGC evidence shipped (commits 6633f24 + 013708e); fill + submit deferred |
| §9 Monitoring | n/a | n/a — post-launch |
