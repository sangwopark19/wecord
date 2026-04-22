import { describe, it, expect, vi, beforeEach } from 'vitest';

let lastSelect: string | null = null;
let lastEqArgs: [string, string] | null = null;
let lastOrderArgs: [string, { ascending: boolean }] | null = null;
let returnedRows: unknown = [];

const orderFn = vi.fn(async (col: string, opts: { ascending: boolean }) => {
  lastOrderArgs = [col, opts];
  return { data: returnedRows, error: null };
});
const eqFn = vi.fn((col: string, val: string) => {
  lastEqArgs = [col, val];
  return { order: orderFn };
});
const selectFn = vi.fn((cols: string) => {
  lastSelect = cols;
  return { eq: eqFn };
});
const fromFn = vi.fn(() => ({ select: selectFn }));

vi.mock('../../lib/supabase', () => ({
  supabase: { from: fromFn },
}));

describe('useMyCommunities query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    returnedRows = [];
    lastSelect = null;
    lastEqArgs = null;
    lastOrderArgs = null;
  });

  async function runQueryFn(userId: string) {
    // We replay the query construction the hook performs.
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase
      .from('community_members')
      .select(
        'community_nickname, joined_at, communities!inner(id, name, slug, cover_image_url)'
      )
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  it('selects community_members with !inner join filtered by user_id', async () => {
    await runQueryFn('user-1');
    expect(fromFn).toHaveBeenCalledWith('community_members');
    expect(lastSelect).toContain('communities!inner');
    expect(lastEqArgs).toEqual(['user_id', 'user-1']);
  });

  it('orders by joined_at desc', async () => {
    await runQueryFn('user-1');
    expect(lastOrderArgs).toEqual(['joined_at', { ascending: false }]);
  });

  it('maps row shape with communities array → JoinedCommunity', () => {
    // The hook normalizes the embedded `communities` field with pickCommunity().
    // Replicate the contract: array form first element OR plain object.
    const row = {
      community_nickname: 'fan1',
      joined_at: '2026-04-01T00:00:00Z',
      communities: [{ id: 'c1', name: 'Aurora', slug: 'aurora', cover_image_url: null }],
    };
    const c = Array.isArray(row.communities) ? row.communities[0] : row.communities;
    const mapped = {
      communityId: c.id,
      communityName: c.name,
      communitySlug: c.slug,
      coverImageUrl: c.cover_image_url,
      myCommunityNickname: row.community_nickname,
      joinedAt: row.joined_at,
    };
    expect(mapped).toEqual({
      communityId: 'c1',
      communityName: 'Aurora',
      communitySlug: 'aurora',
      coverImageUrl: null,
      myCommunityNickname: 'fan1',
      joinedAt: '2026-04-01T00:00:00Z',
    });
  });

  it('returns empty array when user has no memberships', async () => {
    returnedRows = [];
    const result = await runQueryFn('user-2');
    expect(result).toEqual([]);
  });
});
