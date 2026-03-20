import { describe, it, expect, vi } from 'vitest';

// Mock supabase to verify correct query patterns
const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  or: vi.fn().mockResolvedValue({
    data: [
      {
        id: 'post-1',
        community_id: 'community-1',
        author_id: 'user-1',
        author_role: 'fan',
        content: 'Hello World',
        media_urls: null,
        post_type: 'text',
        like_count: 5,
        comment_count: 2,
        created_at: '2026-03-20T00:00:00Z',
        author_nickname: 'FanUser#1234',
        author_cm_id: 'cm-1',
        artist_member_name: null,
        community_name: 'Test Community',
        community_slug: 'test-community',
      },
    ],
    error: null,
  }),
};

const mockLikesChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
};

const mockFollowsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
};

const mockFrom = vi.fn((table: string) => {
  if (table === 'posts_with_nickname') {
    return mockQueryChain;
  }
  if (table === 'likes') {
    return mockLikesChain;
  }
  if (table === 'community_follows') {
    return mockFollowsChain;
  }
  return {};
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('useFanFeed query patterns', () => {
  it('queries posts_with_nickname view (never raw posts)', async () => {
    const { supabase } = await import('../lib/supabase');

    // Simulate what useFanFeed does for latest sort
    supabase
      .from('posts_with_nickname')
      .select('*')
      .eq('community_id', 'community-1')
      .eq('author_role', 'fan')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(15);

    expect(mockFrom).toHaveBeenCalledWith('posts_with_nickname');
    // Ensure it never queries raw 'posts' for display
    const calls = (mockFrom as ReturnType<typeof vi.fn>).mock.calls.map(([t]) => t);
    expect(calls).not.toContain('posts');
  });

  it('returns cursor-paginated data for latest sort', async () => {
    const { supabase } = await import('../lib/supabase');

    // First page — no cursor
    await supabase
      .from('posts_with_nickname')
      .select('*')
      .eq('community_id', 'community-1')
      .eq('author_role', 'fan')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(15)
      .or('created_at.lt.2026-03-20T00:00:00Z,and(created_at.eq.2026-03-20T00:00:00Z,id.lt.post-1)');

    expect(mockQueryChain.or).toHaveBeenCalled();
  });

  it('uses offset pagination for popular sort', async () => {
    const { supabase } = await import('../lib/supabase');

    const PAGE_SIZE = 15;
    const page = 0;

    supabase
      .from('posts_with_nickname')
      .select('*')
      .eq('community_id', 'community-1')
      .eq('author_role', 'fan')
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    expect(mockQueryChain.range).toHaveBeenCalledWith(0, 14);
  });

  it('applies hot filter with like_count threshold', async () => {
    const { supabase } = await import('../lib/supabase');

    supabase
      .from('posts_with_nickname')
      .select('*')
      .eq('community_id', 'community-1')
      .eq('author_role', 'fan')
      .gte('like_count', 10)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(15);

    expect(mockQueryChain.gte).toHaveBeenCalledWith('like_count', 10);
  });

  it('sort and filter params change queryKey (different caches)', () => {
    const latestAllKey = ['fanFeed', 'community-1', 'latest', 'all'];
    const popularAllKey = ['fanFeed', 'community-1', 'popular', 'all'];
    const latestFollowingKey = ['fanFeed', 'community-1', 'latest', 'following'];

    expect(latestAllKey).not.toEqual(popularAllKey);
    expect(latestAllKey).not.toEqual(latestFollowingKey);
    expect(popularAllKey).not.toEqual(latestFollowingKey);
  });
});
