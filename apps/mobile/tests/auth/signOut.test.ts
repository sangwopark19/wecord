import { describe, it } from 'vitest';

describe('authStore.signOut', () => {
  it.todo('calls supabase.auth.signOut');
  it.todo('clears session/user/profile/onboardingData in authStore');
  it.todo('invokes queryClient.clear on TanStack cache (T-7-05: stale data eviction)');
  it.todo('replaces router to /(auth)/login stack');
});
