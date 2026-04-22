// Pure helpers for the delete-account flow. Lifted out of useDeleteAccount so
// unit tests can exercise the URL-build + signOut-ordering contract without
// renderHook (RNTR peer pin — 07-01 deviation #5).

export function buildDeleteUserRequest(args: {
  supabaseUrl: string;
  accessToken: string;
}): { url: string; init: RequestInit } {
  return {
    url: `${args.supabaseUrl}/functions/v1/delete-user`,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  };
}

// Decision: should we proceed with the Edge Function call given a session?
// Returns the gate reason if the call MUST NOT happen.
export function gateDeleteCall(session: { access_token?: string } | null): {
  ok: boolean;
  reason?: string;
} {
  if (!session) return { ok: false, reason: 'no_session' };
  if (!session.access_token) return { ok: false, reason: 'no_session' };
  return { ok: true };
}

// On Edge Function response: should we call signOut? Only on 2xx; 401 must
// NOT call signOut (T-7-02 — server says nothing was deleted; we keep the
// session locally so the user can retry without losing context).
export function shouldSignOutAfter(status: number): boolean {
  return status >= 200 && status < 300;
}
