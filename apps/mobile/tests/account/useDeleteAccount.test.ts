import { describe, it } from 'vitest';

describe('useDeleteAccount (T-7-02)', () => {
  it.todo('fetches /functions/v1/delete-user with Authorization Bearer {session.access_token}');
  it.todo('returns 401 path: does NOT call signOut');
  it.todo('returns 200 path: calls authStore.signOut after Edge Function resolves');
  it.todo('throws when session is absent (no double-logout)');
});
