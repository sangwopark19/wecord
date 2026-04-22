import { describe, it, expect } from 'vitest';
import {
  buildDeleteUserRequest,
  gateDeleteCall,
  shouldSignOutAfter,
} from '../../hooks/account/deleteAccountHelpers';

// T-7-02 mitigation contract — pure helpers (RNTR peer pin blocks renderHook).
describe('useDeleteAccount (T-7-02) — pure contract', () => {
  it('fetches /functions/v1/delete-user with Authorization Bearer {access_token}', () => {
    const r = buildDeleteUserRequest({
      supabaseUrl: 'https://abc.supabase.co',
      accessToken: 'jwt-xyz',
    });
    expect(r.url).toBe('https://abc.supabase.co/functions/v1/delete-user');
    expect(r.init.method).toBe('POST');
    const headers = r.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-xyz');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('returns 401 path: does NOT call signOut (shouldSignOutAfter=false)', () => {
    expect(shouldSignOutAfter(401)).toBe(false);
  });

  it('returns 200 path: calls signOut after Edge Function resolves', () => {
    expect(shouldSignOutAfter(200)).toBe(true);
    expect(shouldSignOutAfter(204)).toBe(true);
    expect(shouldSignOutAfter(299)).toBe(true);
  });

  it('returns 5xx path: does NOT call signOut', () => {
    expect(shouldSignOutAfter(500)).toBe(false);
    expect(shouldSignOutAfter(503)).toBe(false);
  });

  it('throws when session is absent (no double-logout — T-7-02)', () => {
    expect(gateDeleteCall(null)).toEqual({ ok: false, reason: 'no_session' });
    expect(gateDeleteCall({})).toEqual({ ok: false, reason: 'no_session' });
    expect(gateDeleteCall({ access_token: '' })).toEqual({ ok: false, reason: 'no_session' });
  });

  it('proceeds when session has access_token', () => {
    expect(gateDeleteCall({ access_token: 'jwt' })).toEqual({ ok: true });
  });
});
