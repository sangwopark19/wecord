// Apple Sign in with Apple — token revocation client.
// https://appleid.apple.com/auth/revoke
//
// Builds an ES256 client_secret JWT using APPLE_PRIVATE_KEY (.p8 contents) and
// POSTs it together with the user's Apple refresh_token to Apple's revoke
// endpoint. Required by App Review Guideline 4.8 — apps offering Sign in with
// Apple MUST also revoke tokens when the account is deleted (Phase 7 / D-37 /
// T-7-02 / [REVIEW HIGH — Apple revoke]).
//
// This module is pure (only depends on `crypto.subtle` + `fetch`) so the unit
// tests can inject a fake fetch and assert the request shape without network.

import { create as createJWT } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

export interface AppleRevokeDeps {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export interface AppleRevokeCredentials {
  teamId: string;          // APPLE_TEAM_ID
  keyId: string;           // APPLE_KEY_ID
  servicesId: string;      // APPLE_SERVICES_ID — client_id Apple sees
  privateKeyPem: string;   // APPLE_PRIVATE_KEY — contents of .p8
}

export interface AppleRevokeResult {
  skipped: boolean;        // true when credentials/refresh_token missing
  status?: number;         // HTTP status from Apple
  error?: string;
}

export async function buildAppleClientSecret(
  creds: AppleRevokeCredentials,
  now: number = Math.floor(Date.now() / 1000)
): Promise<string> {
  const pemBody = creds.privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const payload = {
    iss: creds.teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 180, // Apple caps at 6 months
    aud: 'https://appleid.apple.com',
    sub: creds.servicesId,
  };
  const header = { alg: 'ES256', kid: creds.keyId, typ: 'JWT' };
  return createJWT(header, payload, cryptoKey);
}

export async function revokeAppleRefreshToken(
  creds: AppleRevokeCredentials | null,
  refreshToken: string | null,
  deps: AppleRevokeDeps = {}
): Promise<AppleRevokeResult> {
  if (
    !creds ||
    !creds.teamId ||
    !creds.keyId ||
    !creds.servicesId ||
    !creds.privateKeyPem
  ) {
    return { skipped: true, error: 'missing_apple_credentials' };
  }
  if (!refreshToken) {
    return { skipped: true, error: 'missing_refresh_token' };
  }

  let clientSecret: string;
  try {
    clientSecret = await buildAppleClientSecret(creds, deps.now ? deps.now() : undefined);
  } catch (err) {
    return {
      skipped: false,
      error: err instanceof Error ? err.message : 'client_secret_build_failed',
    };
  }

  const body = new URLSearchParams({
    client_id: creds.servicesId,
    client_secret: clientSecret,
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });

  const f = deps.fetchImpl ?? fetch;
  try {
    const res = await f('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      return { skipped: false, status: res.status, error: await res.text() };
    }
    return { skipped: false, status: res.status };
  } catch (err) {
    return {
      skipped: false,
      error: err instanceof Error ? err.message : 'revoke_network_error',
    };
  }
}
