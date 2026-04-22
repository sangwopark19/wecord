// Phase 7 / D-37 / T-7-02 — delete-user Edge Function.
//
// Flow (orchestrated by handler(req, deps) for testability):
//   1. POST + Authorization: Bearer <jwt> required.
//   2. Validate JWT via auth.getUser(token). 401 if invalid/missing.
//   3. (Task 5b) Lookup auth.identities for provider='apple' to capture
//      Apple refresh_token before it disappears.
//   4. Enumerate Storage paths: avatars/{user_id}/* + post-media/* via
//      posts.media_urls for the user. Best-effort cleanup.
//   5. (Task 5b) If apple identity present, call Apple /auth/revoke
//      (best-effort; failure does not block deletion).
//   6. RPC delete_account(user.id) — atomic DB-level cascade. 500 on error.
//   7. auth.admin.deleteUser(user.id) — removes auth.users; push_tokens
//      cascades automatically.
//   8. 200 { ok: true, appleRevoke: <outcome> }.
//
// User.id ALWAYS comes from the validated JWT, never from the request body —
// this is the core T-7-02 mitigation.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  revokeAppleRefreshToken,
  type AppleRevokeCredentials,
  type AppleRevokeResult,
} from './apple-revoke.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export interface HandlerDeps {
  adminClient?: SupabaseClient;
  userClientFactory?: (token: string) => SupabaseClient;
  appleRevoke?: typeof revokeAppleRefreshToken;
  appleCreds?: AppleRevokeCredentials | null;
}

function readAppleCreds(): AppleRevokeCredentials | null {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const servicesId = Deno.env.get('APPLE_SERVICES_ID');
  const privateKeyPem = Deno.env.get('APPLE_PRIVATE_KEY');
  if (!teamId || !keyId || !servicesId || !privateKeyPem) return null;
  return { teamId, keyId, servicesId, privateKeyPem };
}

function defaultAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function defaultUserClientFactory(token: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function handler(req: Request, deps: HandlerDeps = {}): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json({ error: 'unauthorized' }, 401);

  const userClient = (deps.userClientFactory ?? defaultUserClientFactory)(token);
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);
  const user = userData.user;

  const admin = deps.adminClient ?? defaultAdminClient();

  // 3. Lookup Apple identity (Task 5b — Apple Sign in with Apple revocation)
  let appleRefreshToken: string | null = null;
  let isAppleUser = false;
  try {
    const { data: ud } = await admin.auth.admin.getUserById(user.id);
    const identities = ud?.user?.identities ?? [];
    const apple = identities.find((i) => i.provider === 'apple');
    if (apple) {
      isAppleUser = true;
      const idData = (apple.identity_data ?? {}) as Record<string, unknown>;
      const rt = idData.refresh_token;
      if (typeof rt === 'string' && rt.length > 0) appleRefreshToken = rt;
    }
  } catch (err) {
    console.warn('[delete-user] identity lookup failed', err);
  }

  // 4. Storage cleanup — best-effort. Avatars: avatars/{user_id}/*. Post-media:
  //    {community_id}/{user_id}/* — enumerate via posts.media_urls.
  try {
    const { data: avatarObjs } = await admin.storage.from('avatars').list(user.id);
    if (avatarObjs && avatarObjs.length > 0) {
      const paths = avatarObjs.map((o) => `${user.id}/${o.name}`);
      await admin.storage.from('avatars').remove(paths);
    }
  } catch (err) {
    console.warn('[delete-user] avatars cleanup failed', err);
  }

  try {
    const { data: posts } = await admin
      .from('posts')
      .select('media_urls')
      .eq('author_id', user.id);
    const objectPaths: string[] = [];
    for (const p of posts ?? []) {
      const urls = (p as { media_urls?: string[] | null }).media_urls ?? [];
      for (const u of urls) {
        // Object path is the slice after `/storage/v1/object/public/post-media/`.
        const match = /\/post-media\/(.+)$/.exec(u);
        if (match && match[1]) objectPaths.push(match[1]);
      }
    }
    if (objectPaths.length > 0) {
      await admin.storage.from('post-media').remove(objectPaths);
    }
  } catch (err) {
    console.warn('[delete-user] post-media cleanup failed', err);
  }

  // 5. Apple revoke — best-effort
  const appleCredsToUse: AppleRevokeCredentials | null =
    deps.appleCreds !== undefined ? deps.appleCreds : readAppleCreds();
  const appleRevokeFn = deps.appleRevoke ?? revokeAppleRefreshToken;
  let revokeOutcome: AppleRevokeResult = { skipped: true, error: 'not_apple_user' };
  if (isAppleUser) {
    try {
      revokeOutcome = await appleRevokeFn(appleCredsToUse, appleRefreshToken);
    } catch (err) {
      revokeOutcome = {
        skipped: false,
        error: err instanceof Error ? err.message : 'apple_revoke_threw',
      };
    }
  }

  // 6. delete_account RPC — T-7-02: user.id is the JWT subject
  const { error: rpcErr } = await admin.rpc('delete_account', { p_user_id: user.id });
  if (rpcErr) return json({ error: 'delete_failed', detail: rpcErr.message }, 500);

  // 7. Remove auth.users row (push_tokens cascades automatically)
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) return json({ error: 'auth_delete_failed', detail: authErr.message }, 500);

  return json({ ok: true, appleRevoke: revokeOutcome }, 200);
}

Deno.serve((req: Request) => handler(req));
