import { describe, it, expect, vi, beforeEach } from 'vitest';

const supaSignOut = vi.fn(async () => ({ error: null }));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: supaSignOut,
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

beforeEach(async () => {
  vi.clearAllMocks();
  // Reset Zustand store between tests by re-importing
  vi.resetModules();
});

describe('authStore.signOut (T-7-05)', () => {
  it('calls supabase.auth.signOut', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    await useAuthStore.getState().signOut();
    expect(supaSignOut).toHaveBeenCalledTimes(1);
  });

  it('clears session/user/profile/onboardingData', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    // seed
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { user: { id: 'u' } } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'u' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile: { userId: 'u' } as any,
      onboardingData: { dateOfBirth: '2000-01-01' },
    });
    await useAuthStore.getState().signOut();
    const s = useAuthStore.getState();
    expect(s.session).toBeNull();
    expect(s.user).toBeNull();
    expect(s.profile).toBeNull();
    expect(s.onboardingData).toBeNull();
  });

  it('invokes registered onSignOut callback after state clear (T-7-05)', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    const cb = vi.fn();
    useAuthStore.getState().registerOnSignOut(cb);
    await useAuthStore.getState().signOut();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('signOut completes safely when no callback is registered', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    await expect(useAuthStore.getState().signOut()).resolves.toBeUndefined();
  });

  it('clears state even when supabase.auth.signOut rejects (finally guarantee)', async () => {
    supaSignOut.mockRejectedValueOnce(new Error('network'));
    const { useAuthStore } = await import('../../stores/authStore');
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile: { userId: 'u' } as any,
    });
    const cb = vi.fn();
    useAuthStore.getState().registerOnSignOut(cb);
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not rethrow when registered callback throws', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    useAuthStore.getState().registerOnSignOut(() => {
      throw new Error('boom');
    });
    await expect(useAuthStore.getState().signOut()).resolves.toBeUndefined();
  });
});
