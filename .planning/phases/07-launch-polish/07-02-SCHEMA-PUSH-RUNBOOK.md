# Phase 7 Plan 02 — Local Schema Push Runbook (Task 6, BLOCKING)

**Status:** Documented for developer to run on first checkout after the
worktree merges to main. The wave-2 worktree has no live local Supabase
container (`supabase_db_wecord` is not running), so the actual `db reset` /
`db push --local` invocations cannot run inside the executor.

**Production push is INTENTIONALLY DEFERRED** to Plan 07-03 Task 2, which
runs after the production Supabase project is provisioned.

## Files this runbook applies

Migrations (3, all idempotent):

| File | Adds |
|------|------|
| `packages/supabase/migrations/20260422000001_phase7_profile_dm_launch_notify.sql` | `profiles.dm_launch_notify boolean` (shipped by 07-01; included for completeness) |
| `packages/supabase/migrations/20260422000006_phase7_avatars_bucket.sql` | Storage bucket `avatars` + 4 RLS policies (T-7-04) |
| `packages/supabase/migrations/20260422000007_phase7_delete_account_rpc.sql` | `public.delete_account(uuid)` SECURITY DEFINER + service_role-only EXECUTE (T-7-02) |

Edge Function:

| Path | Notes |
|------|-------|
| `packages/supabase/functions/delete-user/` | `index.ts` + `apple-revoke.ts` + tests. Deploys via `supabase functions deploy delete-user`. |

Local-only test helper (NOT a migration):

| Path | Notes |
|------|-------|
| `packages/supabase/tests/sql/delete_account_smoke.sql` | Inserts synthetic user → invokes RPC → asserts cascade. |
| `packages/supabase/tests/run-delete-account-smoke.sh` | Refuses non-local SUPABASE_ENV; loads + invokes + drops the helper. |

## Run order on developer machine

```bash
# 1. Start local stack if not running
cd packages/supabase && supabase start

# 2. Apply migrations (db reset is destructive; use db push --local for incremental)
supabase db reset
# OR (less destructive):
supabase db push --local

# 3. Sanity-check
supabase db remote exec --local "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='dm_launch_notify';"
psql "$LOCAL_DB_URL" -c "SELECT id FROM storage.buckets WHERE id='avatars';"
psql "$LOCAL_DB_URL" -c "SELECT proname FROM pg_proc WHERE proname='delete_account';"

# 4. T-7-02 smoke test
SUPABASE_ENV=local LOCAL_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres \
  packages/supabase/tests/run-delete-account-smoke.sh
# Expected: "delete_account smoke: OK"

# 5. Deploy + serve Edge Function locally
supabase functions serve delete-user

# 6. Confirm typecheck/build still pass (Drizzle types unaffected — the new
#    columns and bucket exist in DB only; client uses string keys)
cd apps/mobile && pnpm typecheck

# 7. Optional: Deno tests
cd packages/supabase && deno test --allow-env --no-check functions/delete-user/
```

## Why this can't run in the worktree executor

The executor agent runs in a git worktree at
`.claude/worktrees/agent-a3503aeb/`. The orchestrator did not start a local
Supabase container in this worktree (it would conflict with the developer's
main repo container on the same ports 54321/54322). All migration files
have been written to disk and grep-verified by the plan's `<verify>` block;
the actual apply happens after the worktree merges to main and the
developer runs the commands above on their machine.

**This deferral is intentional and matches the plan's executor note** in
Task 6 Step 6: "Non-TTY environment hint — if `supabase` prompts
interactively for access token, export `SUPABASE_ACCESS_TOKEN`. ... This
task covers target (a) local dev only."

## Production push (Plan 07-03 Task 2)

After the production Supabase project is provisioned:

```bash
supabase link --project-ref <prod-project-ref>
supabase db push           # Apply all migrations to prod
supabase functions deploy delete-user --project-ref <prod-project-ref>
supabase secrets set --project-ref <prod-project-ref> \
  APPLE_TEAM_ID=... APPLE_KEY_ID=... APPLE_SERVICES_ID=... APPLE_PRIVATE_KEY="$(cat AuthKey_*.p8)"
```

Verification: same psql checks as local, just against the prod DB URL.

## Observed gates (executor recorded)

- All 3 migration files exist: PASS
- All 4 Edge Function files exist (index, index.test, apple-revoke, apple-revoke.test): PASS
- `apps/mobile` typecheck: PASS
- `apps/mobile` vitest: 99 passing / 45 todo / 0 failing
- Schema column-name verification (posts.content, comments.content,
  reports.reporter_id, community_follows.{follower,following}_cm_id,
  push_tokens FK CASCADE on auth.users): PASS via grep on
  `packages/db/src/schema/`. SQL in `delete_account` matches.
- `wv_test_delete_account_smoke()` SQL helper present in
  `packages/supabase/tests/sql/`, NOT in `packages/supabase/migrations/`: PASS
- Runner `run-delete-account-smoke.sh` is `chmod +x`: PASS
- Runner refuses `SUPABASE_ENV != local` (line 7 of the script): PASS

Live DB verification (column / bucket / proname / smoke output) DEFERRED to
developer machine — see commands in step 3+4 above.
