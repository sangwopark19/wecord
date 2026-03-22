import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track insert calls
let lastInsertArg: Record<string, string> | null = null;
let insertError: { code: string; message: string } | null = null;

const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn((arg: Record<string, string>) => {
  lastInsertArg = arg;
  if (insertError) {
    return { data: null, error: insertError, select: mockSelect };
  }
  return { data: arg, error: null, select: mockSelect };
});

const mockFrom = vi.fn((table: string) => {
  if (table === 'reports') {
    return {
      insert: mockInsert,
    };
  }
  return {};
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: 'user-123' },
    }),
  },
}));

describe('useReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastInsertArg = null;
    insertError = null;
  });

  it('inserts into reports table with correct payload', async () => {
    const { reportMutationFn } = await import('../hooks/report/useReport');

    await reportMutationFn({
      targetType: 'post',
      targetId: 'post-abc',
      reason: 'spam',
    });

    expect(mockFrom).toHaveBeenCalledWith('reports');
    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'user-123',
      target_type: 'post',
      target_id: 'post-abc',
      reason: 'spam',
    });
  });

  it('handles error code 23505 by throwing DUPLICATE_REPORT', async () => {
    insertError = { code: '23505', message: 'duplicate key value' };

    const { reportMutationFn } = await import('../hooks/report/useReport');

    await expect(
      reportMutationFn({
        targetType: 'comment',
        targetId: 'comment-xyz',
        reason: 'hate',
      })
    ).rejects.toThrow('DUPLICATE_REPORT');
  });

  it('throws generic error for non-duplicate failures', async () => {
    insertError = { code: '42501', message: 'permission denied' };

    const { reportMutationFn } = await import('../hooks/report/useReport');

    await expect(
      reportMutationFn({
        targetType: 'post',
        targetId: 'post-fail',
        reason: 'violence',
      })
    ).rejects.toThrow('permission denied');
  });

  it('includes reason_text when reason is other', async () => {
    const { reportMutationFn } = await import('../hooks/report/useReport');

    await reportMutationFn({
      targetType: 'post',
      targetId: 'post-other',
      reason: 'other',
      reasonText: 'Custom report reason',
    });

    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'user-123',
      target_type: 'post',
      target_id: 'post-other',
      reason: 'other',
      reason_text: 'Custom report reason',
    });
  });
});
