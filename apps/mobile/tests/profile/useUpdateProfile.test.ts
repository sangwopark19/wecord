import { describe, it } from 'vitest';

describe('useUpdateProfile', () => {
  it.todo('updates profiles row via supabase.from.update with user-scoped filter');
  it.todo('merges returned profile into authStore via setProfile');
  it.todo('invalidates [profile, userId] query on settled');
  it.todo(
    'rolls back optimistic profile on error (T-7-03: self-only RLS is still the server enforcement, client is optimistic only)'
  );
});
