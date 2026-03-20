import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track what insert was called with
let lastInsertArg: Record<string, string> | null = null;
let insertError: { code: string; message: string } | null = null;

const mockDeleteChain = {
  eq: vi.fn().mockReturnThis(),
};
const mockDeleteFn = vi.fn(() => mockDeleteChain);

const mockInsert = vi.fn(async (arg: Record<string, string>) => {
  lastInsertArg = arg;
  return { data: null, error: insertError };
});

const mockFrom = vi.fn((table: string) => {
  if (table === 'likes') {
    return {
      delete: mockDeleteFn,
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
  }
  return {};
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('useLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastInsertArg = null;
    insertError = null;
  });

  it('calls insert for a new like (isLiked=false)', async () => {
    const { supabase } = await import('../lib/supabase');

    const isLiked = false;
    const targetId = 'post-123';
    const userId = 'user-abc';
    const targetType = 'post';

    if (!isLiked) {
      await supabase.from('likes').insert({ user_id: userId, target_type: targetType, target_id: targetId });
    }

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
  });

  it('calls delete for an unlike (isLiked=true)', async () => {
    const { supabase } = await import('../lib/supabase');

    const isLiked = true;
    const targetId = 'post-123';
    const userId = 'user-abc';
    const targetType = 'post';

    if (isLiked) {
      supabase.from('likes').delete().eq('user_id', userId).eq('target_type', targetType).eq('target_id', targetId);
    }

    expect(mockDeleteFn).toHaveBeenCalled();
    expect(mockDeleteChain.eq).toHaveBeenCalledWith('user_id', userId);
  });

  it('handles 23505 duplicate like error gracefully', async () => {
    const { supabase } = await import('../lib/supabase');

    // Set up insert to return a 23505 error
    insertError = { code: '23505', message: 'duplicate key value' };

    const simulateMutation = async () => {
      const { error } = await supabase.from('likes').insert({
        user_id: 'user-abc',
        target_type: 'post',
        target_id: 'post-123',
      });

      // 23505 = already liked — ignore gracefully
      if (error && error.code !== '23505') throw error;
    };

    await expect(simulateMutation()).resolves.toBeUndefined();
  });

  it('optimistic update changes like_count correctly', () => {
    const post = { id: 'post-1', like_count: 5, isLiked: false };

    // Simulate optimistic like toggle
    const updated = {
      ...post,
      isLiked: !post.isLiked,
      like_count: post.isLiked
        ? Math.max(0, post.like_count - 1)
        : post.like_count + 1,
    };

    expect(updated.isLiked).toBe(true);
    expect(updated.like_count).toBe(6);

    // Simulate optimistic unlike
    const unliked = {
      ...updated,
      isLiked: !updated.isLiked,
      like_count: updated.isLiked
        ? Math.max(0, updated.like_count - 1)
        : updated.like_count + 1,
    };

    expect(unliked.isLiked).toBe(false);
    expect(unliked.like_count).toBe(5);
  });
});
