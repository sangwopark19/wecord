// Deno tests for the delete-user Edge Function.
//
// Run locally with:
//   cd packages/supabase && deno test --allow-env --no-check functions/delete-user/
//
// Tests inject fakes via the handler's `deps` parameter — no network, no real
// Supabase. Coverage:
//
//   T-7-02 mitigation:
//     - 401 without Authorization header
//     - 401 with invalid JWT (auth.getUser returns null user)
//     - 200 path uses user.id from the JWT (not from request body)
//
//   Apple Sign in with Apple revoke (Task 5b — REVIEW HIGH):
//     - revoke called when provider=apple
//     - revoke skipped when provider=google
//     - revoke failure does NOT block auth.admin.deleteUser
//     - missing APPLE_* env → skipped=true, no 500

import { assertEquals, assert } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { handler } from './index.ts';
import type { AppleRevokeResult } from './apple-revoke.ts';

// Minimal SupabaseClient surface — only the fields handler() touches.
function makeFakeAdmin(opts: {
  userIdentities?: Array<{ provider: string; identity_data: Record<string, unknown> }>;
  rpcResult?: { error: { message: string } | null };
  authDeleteResult?: { error: { message: string } | null };
  postsResult?: { data: Array<{ media_urls: string[] | null }> | null };
  storageListResult?: { data: Array<{ name: string }> | null };
  rpcSpy?: { calledWith: { fn?: string; args?: unknown } };
}) {
  return {
    auth: {
      admin: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getUserById: async (_id: string) => ({
          data: { user: { identities: opts.userIdentities ?? [] } },
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        deleteUser: async (_id: string) => opts.authDeleteResult ?? { error: null },
      },
    },
    rpc: async (fn: string, args: unknown) => {
      if (opts.rpcSpy) {
        opts.rpcSpy.calledWith = { fn, args };
      }
      return opts.rpcResult ?? { error: null };
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: (_table: string) => ({
      select: () => ({
        eq: async () => opts.postsResult ?? { data: [] },
      }),
    }),
    storage: {
      from: () => ({
        list: async () => opts.storageListResult ?? { data: [] },
        remove: async () => ({ data: null, error: null }),
      }),
    },
  } as unknown as Parameters<typeof handler>[1]['adminClient'];
}

function makeUserClientFactory(returnUser: { id: string } | null) {
  return () =>
    ({
      auth: {
        getUser: async () => ({
          data: { user: returnUser },
          error: returnUser ? null : { message: 'invalid' },
        }),
      },
    }) as unknown as Parameters<typeof handler>[1]['userClientFactory'] extends (
      t: string,
    ) => infer R
      ? R
      : never;
}

Deno.test('delete-user: 401 without Authorization header (T-7-02)', async () => {
  const res = await handler(new Request('http://localhost/', { method: 'POST' }));
  assertEquals(res.status, 401);
});

Deno.test('delete-user: 401 with invalid JWT (T-7-02)', async () => {
  const res = await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad' },
    }),
    {
      userClientFactory: makeUserClientFactory(null) as never,
      adminClient: makeFakeAdmin({}) as never,
    },
  );
  assertEquals(res.status, 401);
});

Deno.test('delete-user: 200 calls delete_account RPC with user.id from JWT (T-7-02)', async () => {
  const rpcSpy: { calledWith: { fn?: string; args?: unknown } } = { calledWith: {} };
  const res = await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer good' },
      body: JSON.stringify({ p_user_id: 'attacker-injected' }),
    }),
    {
      userClientFactory: makeUserClientFactory({ id: 'real-user-from-jwt' }) as never,
      adminClient: makeFakeAdmin({ rpcSpy }) as never,
      appleCreds: null,
    },
  );
  assertEquals(res.status, 200);
  assertEquals(rpcSpy.calledWith.fn, 'delete_account');
  assertEquals(
    (rpcSpy.calledWith.args as { p_user_id: string }).p_user_id,
    'real-user-from-jwt',
  );
});

Deno.test('delete-user: calls apple revoke when provider=apple (Guideline 4.8)', async () => {
  let revokeCalled = false;
  let revokeToken: string | null = null;
  const fakeRevoke = async (
    _creds: unknown,
    refreshToken: string | null,
  ): Promise<AppleRevokeResult> => {
    revokeCalled = true;
    revokeToken = refreshToken;
    return { skipped: false, status: 200 };
  };

  const res = await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer good' },
    }),
    {
      userClientFactory: makeUserClientFactory({ id: 'apple-user-1' }) as never,
      adminClient: makeFakeAdmin({
        userIdentities: [
          { provider: 'apple', identity_data: { refresh_token: 'apple-rt-123' } },
        ],
      }) as never,
      appleRevoke: fakeRevoke as never,
      appleCreds: {
        teamId: 'T1',
        keyId: 'K1',
        servicesId: 'com.wecord.app',
        privateKeyPem: 'fake-pem',
      },
    },
  );
  assertEquals(res.status, 200);
  assertEquals(revokeCalled, true);
  assertEquals(revokeToken, 'apple-rt-123');
});

Deno.test('delete-user: skips apple revoke when provider=google', async () => {
  let revokeCalled = false;
  const fakeRevoke = async () => {
    revokeCalled = true;
    return { skipped: false, status: 200 };
  };

  const res = await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer good' },
    }),
    {
      userClientFactory: makeUserClientFactory({ id: 'google-user-1' }) as never,
      adminClient: makeFakeAdmin({
        userIdentities: [{ provider: 'google', identity_data: {} }],
      }) as never,
      appleRevoke: fakeRevoke as never,
      appleCreds: null,
    },
  );
  assertEquals(res.status, 200);
  assertEquals(revokeCalled, false);
  const body = await res.json();
  assertEquals(body.appleRevoke.skipped, true);
});

Deno.test('delete-user: revoke failure does NOT block auth.admin.deleteUser', async () => {
  let authDeleteCalled = false;
  const fakeRevoke = async (): Promise<AppleRevokeResult> => ({
    skipped: false,
    status: 500,
    error: 'apple_down',
  });
  const admin = makeFakeAdmin({
    userIdentities: [
      { provider: 'apple', identity_data: { refresh_token: 'rt' } },
    ],
  }) as never;
  // Wrap deleteUser to track invocation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;
  const originalDelete = adminAny.auth.admin.deleteUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminAny.auth.admin.deleteUser = async (id: string) => {
    authDeleteCalled = true;
    return originalDelete(id);
  };

  const res = await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer good' },
    }),
    {
      userClientFactory: makeUserClientFactory({ id: 'apple-user-2' }) as never,
      adminClient: admin,
      appleRevoke: fakeRevoke as never,
      appleCreds: {
        teamId: 'T1',
        keyId: 'K1',
        servicesId: 'com.wecord.app',
        privateKeyPem: 'fake-pem',
      },
    },
  );
  assertEquals(res.status, 200);
  assertEquals(authDeleteCalled, true);
  const body = await res.json();
  assertEquals(body.appleRevoke.error, 'apple_down');
});

Deno.test('delete-user: missing APPLE_* env → skipped=true, no 500', async () => {
  const fakeRevoke = async (
    creds: unknown,
    _rt: unknown,
  ): Promise<AppleRevokeResult> => {
    if (!creds) return { skipped: true, error: 'missing_apple_credentials' };
    return { skipped: false, status: 200 };
  };

  const res = await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer good' },
    }),
    {
      userClientFactory: makeUserClientFactory({ id: 'apple-user-3' }) as never,
      adminClient: makeFakeAdmin({
        userIdentities: [
          { provider: 'apple', identity_data: { refresh_token: 'rt' } },
        ],
      }) as never,
      appleRevoke: fakeRevoke as never,
      appleCreds: null,
    },
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.appleRevoke.skipped, true);
});

Deno.test('delete-user: only deletes JWT-identified user (no cross-account deletion)', async () => {
  const rpcSpy: { calledWith: { fn?: string; args?: unknown } } = { calledWith: {} };
  await handler(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { Authorization: 'Bearer good' },
      body: JSON.stringify({ p_user_id: 'someone-else' }),
    }),
    {
      userClientFactory: makeUserClientFactory({ id: 'jwt-bound-user' }) as never,
      adminClient: makeFakeAdmin({ rpcSpy }) as never,
      appleCreds: null,
    },
  );
  assert(rpcSpy.calledWith.args !== undefined);
  // Whatever the body claims, only the JWT user.id flows to the RPC.
  assertEquals(
    (rpcSpy.calledWith.args as { p_user_id: string }).p_user_id,
    'jwt-bound-user',
  );
});
