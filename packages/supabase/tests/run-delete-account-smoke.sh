#!/usr/bin/env bash
# Phase 7 / D-37 / T-7-02 — local-only smoke runner for delete_account RPC.
#
# Refuses to run unless SUPABASE_ENV=local. Loads the SQL helper, invokes it
# with `app.env=local`, and DROPs the helper function after the test so even
# local DBs do not persist it.

set -euo pipefail

if [ "${SUPABASE_ENV:-local}" != "local" ]; then
  echo "ERROR: delete_account smoke test is local-only (SUPABASE_ENV=$SUPABASE_ENV)" >&2
  exit 2
fi

DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@localhost:54322/postgres}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Loading helper from $SCRIPT_DIR/sql/delete_account_smoke.sql..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/sql/delete_account_smoke.sql"

echo "Running smoke test..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "SET app.env = 'local'; SELECT wv_test_delete_account_smoke();"

echo "Dropping helper..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "DROP FUNCTION IF EXISTS public.wv_test_delete_account_smoke();"

echo "delete_account smoke: OK"
