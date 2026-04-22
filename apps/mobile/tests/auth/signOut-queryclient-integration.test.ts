import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(async () => ({ error: null })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

beforeEach(() => {
  vi.resetModules();
});

describe('signOut + queryClient integration (T-7-05 end-to-end)', () => {
  it('clearing the cache via the registered callback empties primed query data', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['profile', 'user-1'], { id: 'user-1', secret: 'pii' });
    expect(qc.getQueryData(['profile', 'user-1'])).toBeDefined();

    const { useAuthStore } = await import('../../stores/authStore');
    useAuthStore.getState().registerOnSignOut(() => {
      qc.clear();
    });

    await useAuthStore.getState().signOut();

    expect(qc.getQueryData(['profile', 'user-1'])).toBeUndefined();
  });
});
