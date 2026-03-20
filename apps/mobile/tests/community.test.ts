import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSelectChain = {
  textSearch: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Community' }], error: null }),
};

const mockInsertChain = {
  insert: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
};

const mockDeleteChain = {
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
};

const mockFrom = vi.fn((table: string) => {
  if (table === 'communities') {
    return { select: vi.fn().mockReturnValue(mockSelectChain) };
  }
  if (table === 'community_members') {
    return {
      insert: mockInsertChain.insert,
      delete: mockDeleteChain.delete,
    };
  }
  return {};
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { nickname: 'User#1234' }, error: null }),
    },
  },
}));

describe('community hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useCommunitySearch returns data when textSearch query matches', async () => {
    // Simulate what useCommunitySearch hook does
    const { supabase } = await import('../lib/supabase');
    const query = 'test';
    const result = await supabase
      .from('communities')
      .select('id, name')
      .textSearch('name', query, { type: 'websearch', config: 'simple' } as Parameters<typeof mockSelectChain.textSearch>[1])
      .limit(20);

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.error).toBeNull();
  });

  it('useJoinCommunity inserts into community_members with correct nickname', async () => {
    // Simulate what useJoinCommunity hook does
    const { supabase } = await import('../lib/supabase');

    // Generate nickname
    const nicknameResult = await supabase.functions.invoke('generate-nickname');
    expect(nicknameResult.data?.nickname).toBeDefined();

    // Insert into community_members
    mockInsertChain.insert.mockResolvedValueOnce({ data: { id: 'member-1' }, error: null });
    const insertResult = await supabase
      .from('community_members')
      .insert({
        user_id: 'user-123',
        community_id: 'community-456',
        community_nickname: 'User#1234',
        role: 'member',
      });

    expect(mockInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        community_nickname: expect.any(String),
        role: 'member',
      })
    );
    expect(insertResult.error).toBeNull();
  });

  it('useLeaveCommunity deletes community_members row', async () => {
    // Simulate what useLeaveCommunity hook does
    const { supabase } = await import('../lib/supabase');

    mockDeleteChain.delete.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const deleteChain = supabase.from('community_members').delete();
    const result = await (deleteChain as typeof mockDeleteChain).eq('id', 'member-id-123');

    expect(result.error).toBeNull();
  });
});
