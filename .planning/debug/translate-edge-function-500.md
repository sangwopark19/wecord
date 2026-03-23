---
status: diagnosed
trigger: "Investigate why the Supabase Edge Function 'translate' returns 500 Internal Server Error"
created: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Focus

hypothesis: GOOGLE_TRANSLATE_API_KEY secret is not set on the remote Supabase project, causing the edge function to return 500 when it finds content but cannot call Google Translate API
test: confirmed via code analysis + live curl tests
expecting: n/a — diagnosed
next_action: User must set the secret via `supabase secrets set GOOGLE_TRANSLATE_API_KEY=<key>`

## Symptoms

expected: POST to /functions/v1/translate returns translated text (200)
actual: Returns 500 Internal Server Error; user sees "Translation failed. Please try again."
errors: 500 Internal Server Error from translate edge function
reproduction: Tap translate button on any PostCard, CommentRow, or ReplyRow
started: Likely since deployment — secret was never configured

## Eliminated

- hypothesis: Edge function is not deployed
  evidence: curl tests return proper JSON responses (404 for missing content), not Supabase's default "function not found" error
  timestamp: 2026-03-23

- hypothesis: CORS misconfiguration
  evidence: Function handles OPTIONS preflight (line 10-12) and includes Access-Control headers in all responses
  timestamp: 2026-03-23

- hypothesis: Client-side invocation bug
  evidence: useTranslate.ts correctly calls supabase.functions.invoke('translate', { body: {...} }) with target_id, target_type, target_lang — matches edge function's expected request format exactly
  timestamp: 2026-03-23

- hypothesis: post_translations table missing or misconfigured
  evidence: Table is created in initial migration (20260318141420) with correct schema, RLS policies, and unique constraint
  timestamp: 2026-03-23

- hypothesis: Request format mismatch between client and server
  evidence: Client sends { target_id, target_type, target_lang }; server destructures exactly those fields (line 15)
  timestamp: 2026-03-23

## Evidence

- timestamp: 2026-03-23
  checked: Edge function source (packages/supabase/functions/translate/index.ts)
  found: Function explicitly returns 500 with "Translation API key not configured" when Deno.env.get('GOOGLE_TRANSLATE_API_KEY') is falsy (lines 57-63). This is the ONLY intentional 500 path besides the generic catch block.
  implication: If the secret is not set, any request that finds content will always 500.

- timestamp: 2026-03-23
  checked: curl POST to live endpoint with valid UUID
  found: Returns {"error":"Content not found"} with HTTP 404. Function is deployed and executing.
  implication: Function runs, Supabase client works, DB queries work. The 500 only occurs when content IS found (past line 49) but API key is missing.

- timestamp: 2026-03-23
  checked: .env files in functions directory
  found: No .env file exists in packages/supabase/functions/translate/ or packages/supabase/functions/
  implication: No local env override. Secret must be set via `supabase secrets set`.

- timestamp: 2026-03-23
  checked: Supabase project link status
  found: No .supabase/project-ref file exists — project is not linked locally
  implication: Cannot run `supabase secrets list` to verify. Secret must be set via Supabase Dashboard or after linking.

- timestamp: 2026-03-23
  checked: Phase 04 verification docs
  found: Translation test is marked as "why_human: Requires GOOGLE_TRANSLATE_API_KEY configured and running app" — confirming this was a known prerequisite that was never verified end-to-end.
  implication: The API key was planned but likely never actually configured as a Supabase secret.

- timestamp: 2026-03-23
  checked: Client-side error handling (useTranslate.ts)
  found: supabase.functions.invoke returns error on non-2xx; hook sets error state; TranslateButton shows t('error') which maps to "Translation failed. Please try again."
  implication: Client-side handling is correct — it faithfully surfaces the server 500.

- timestamp: 2026-03-23
  checked: Google Translate API URL in edge function
  found: Uses `https://translation.googleapis.com/language/translate/v2?key=${apiKey}` — standard Google Cloud Translation API v2 basic edition
  implication: Requires a valid Google Cloud API key with Translation API enabled.

## Resolution

root_cause: The `GOOGLE_TRANSLATE_API_KEY` Supabase secret is not configured on the remote project. When the edge function finds content to translate (past the DB lookup on line 43-54), it checks for the API key (line 57), finds it undefined, and returns HTTP 500 with `{"error":"Translation API key not configured"}`. The function code itself is correct — the deployment is missing the required secret.

fix: |
  User action required — set the Google Translate API key as a Supabase secret:

  Option A (CLI, requires project link):
    1. cd packages/supabase
    2. npx supabase link --project-ref pvhpchindstbzurgybni
    3. npx supabase secrets set GOOGLE_TRANSLATE_API_KEY=<your-google-cloud-api-key>

  Option B (Dashboard):
    1. Go to https://supabase.com/dashboard/project/pvhpchindstbzurgybni/settings/functions
    2. Add secret: GOOGLE_TRANSLATE_API_KEY = <your-google-cloud-api-key>

  Prerequisites:
    - A Google Cloud project with the Cloud Translation API enabled
    - An API key created in that project (APIs & Services > Credentials)
    - The API key must have the Cloud Translation API allowed

  After setting the secret, redeploy the function:
    npx supabase functions deploy translate --project-ref pvhpchindstbzurgybni

verification: |
  After setting secret and redeploying:
  curl -X POST 'https://pvhpchindstbzurgybni.supabase.co/functions/v1/translate' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer <anon-key>' \
    -d '{"target_id":"<valid-post-id>","target_type":"post","target_lang":"en"}'
  Expected: HTTP 200 with {"translated_text":"...","source_lang":"...","cached":false}

files_changed: []
