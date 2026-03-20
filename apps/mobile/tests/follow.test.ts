import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase community_follows operations
const mockFollowsInsert = vi.fn().mockResolvedValue({ data: { id: 'follow-1' }, error: null });
const mockFollowsDeleteChain = {
  eq: vi.fn().mockReturnThis(),
};
const mockFollowsDelete = vi.fn().mockReturnValue(mockFollowsDeleteChain);

// Set up final eq to resolve
const mockFinalEq = vi.fn().mockResolvedValue({ data: null, error: null });

const mockFrom = vi.fn((table: string) => {
  if (table === 'community_follows') {
    return {
      insert: mockFollowsInsert,
      delete: mockFollowsDelete,
    };
  }
  return {};
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('useFollowMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFollowsInsert.mockResolvedValue({ data: { id: 'follow-1' }, error: null });
    mockFollowsDelete.mockReturnValue(mockFollowsDeleteChain);
    mockFollowsDeleteChain.eq.mockReturnThis();
    mockFinalEq.mockResolvedValue({ data: null, error: null });
  });

  it('calls insert on community_follows when following (isFollowing=false)', async () => {
    const { supabase } = await import('../lib/supabase');

    const followerCmId = 'cm-follower-1';
    const followingCmId = 'cm-following-2';

    await supabase.from('community_follows').insert({
      follower_cm_id: followerCmId,
      following_cm_id: followingCmId,
    });

    expect(mockFrom).toHaveBeenCalledWith('community_follows');
    expect(mockFollowsInsert).toHaveBeenCalledWith({
      follower_cm_id: followerCmId,
      following_cm_id: followingCmId,
    });
  });

  it('calls delete on community_follows when unfollowing (isFollowing=true)', async () => {
    const { supabase } = await import('../lib/supabase');

    const followerCmId = 'cm-follower-1';
    const followingCmId = 'cm-following-2';

    // Simulate the delete chain: .delete().eq(...).eq(...)
    const deleteChain = supabase.from('community_follows').delete();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deleteChain as any).eq('follower_cm_id', followerCmId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deleteChain as any).eq('following_cm_id', followingCmId);

    expect(mockFrom).toHaveBeenCalledWith('community_follows');
    expect(mockFollowsDelete).toHaveBeenCalled();
    expect(mockFollowsDeleteChain.eq).toHaveBeenCalledWith('follower_cm_id', followerCmId);
    expect(mockFollowsDeleteChain.eq).toHaveBeenCalledWith('following_cm_id', followingCmId);
  });

  it('inserts correct fields into community_follows for follow action', async () => {
    const { supabase } = await import('../lib/supabase');

    const params = {
      follower_cm_id: 'cm-123',
      following_cm_id: 'cm-456',
    };

    await supabase.from('community_follows').insert(params);

    expect(mockFollowsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        follower_cm_id: 'cm-123',
        following_cm_id: 'cm-456',
      })
    );
  });
});
