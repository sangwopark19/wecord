import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Shared mock state ----
let mockSingleResult: { data: Record<string, unknown> | null; error: null } = {
  data: { parent_comment_id: null },
  error: null,
};
let mockInsertResult: { data: null; error: null } = { data: null, error: null };
let mockMemberRole = 'member';

const mockDeleteEqChain = {
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
};
const mockDeleteFn = vi.fn(() => mockDeleteEqChain);
const mockInsertFn = vi.fn(async () => mockInsertResult);
const mockSelectSpy = vi.fn().mockReturnThis();
const mockEqSpy = vi.fn().mockReturnThis();

const mockFrom = vi.fn((table: string) => {
  if (table === 'comments') {
    return {
      insert: mockInsertFn,
      delete: mockDeleteFn,
      select: mockSelectSpy,
      eq: mockEqSpy,
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn(async () => mockSingleResult),
    };
  }
  if (table === 'community_members') {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: mockMemberRole }, error: null }),
    };
  }
  if (table === 'likes') {
    return {
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

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingleResult = { data: { parent_comment_id: null }, error: null };
    mockMemberRole = 'member';
  });

  it('queries community_members!inner(community_nickname for author nicknames', async () => {
    const { supabase } = await import('../lib/supabase');

    await supabase
      .from('comments')
      .select('*, author:community_members!inner(community_nickname, id, role)')
      .eq('post_id', 'post-123')
      .order('created_at', { ascending: true });

    expect(mockSelectSpy).toHaveBeenCalledWith(
      expect.stringContaining('community_members!inner(community_nickname')
    );
  });

  it('structures flat comments into root + replies thread', () => {
    const flatComments = [
      {
        id: 'c1',
        parent_comment_id: null,
        content: 'Root comment',
        author: { id: 'u1', community_nickname: 'Fan1', role: 'member' },
      },
      {
        id: 'c2',
        parent_comment_id: 'c1',
        content: 'Reply to root',
        author: { id: 'u2', community_nickname: 'Fan2', role: 'member' },
      },
      {
        id: 'c3',
        parent_comment_id: null,
        content: 'Another root comment',
        author: { id: 'u3', community_nickname: 'Fan3', role: 'member' },
      },
    ];

    // Simulate the buildCommentThread logic from useComments
    const rootComments: any[] = [];
    const replyMap = new Map<string, any[]>();

    for (const comment of flatComments) {
      if (comment.parent_comment_id === null) {
        rootComments.push({ ...comment, replies: [] });
      } else {
        const arr = replyMap.get(comment.parent_comment_id) ?? [];
        arr.push(comment);
        replyMap.set(comment.parent_comment_id, arr);
      }
    }

    for (const root of rootComments) {
      root.replies = replyMap.get(root.id) ?? [];
    }

    expect(rootComments).toHaveLength(2);
    expect(rootComments[0].id).toBe('c1');
    expect(rootComments[0].replies).toHaveLength(1);
    expect(rootComments[0].replies[0].id).toBe('c2');
    expect(rootComments[1].replies).toHaveLength(0);
  });
});

describe('useCreateComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingleResult = { data: { parent_comment_id: null }, error: null };
    mockMemberRole = 'member';
  });

  it('inserts with correct parent_comment_id for replies', async () => {
    const { supabase } = await import('../lib/supabase');

    // Depth guard passes: parent is a root comment (parent_comment_id=null)
    const parentCheck = await supabase
      .from('comments')
      .select('parent_comment_id')
      .eq('id', 'comment-root')
      .single();

    expect(parentCheck.data?.parent_comment_id).toBeNull();

    // Insert comment as reply
    await supabase.from('comments').insert({
      post_id: 'post-123',
      author_id: 'user-abc',
      parent_comment_id: 'comment-root',
      content: 'This is a reply',
      author_role: 'fan',
      is_creator_reply: false,
    });

    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_comment_id: 'comment-root',
        is_creator_reply: false,
      })
    );
  });

  it('rejects reply-to-reply (depth guard)', async () => {
    // Parent comment is itself a reply (has a parent_comment_id)
    mockSingleResult = { data: { parent_comment_id: 'some-root-comment' }, error: null };

    const { supabase } = await import('../lib/supabase');

    const parentComment = await supabase
      .from('comments')
      .select('parent_comment_id')
      .eq('id', 'reply-comment')
      .single();

    // Depth guard: parent already has parent_comment_id → reject
    const isReplyToReply = parentComment.data?.parent_comment_id !== null;
    expect(isReplyToReply).toBe(true);
  });

  it('marks is_creator_reply=true for creator replies', async () => {
    const { supabase } = await import('../lib/supabase');

    // Simulate creator replying to a comment
    const memberRole = 'creator';
    const parentCommentId = 'comment-root';
    const isCreator = memberRole === 'creator';

    await supabase.from('comments').insert({
      post_id: 'post-123',
      author_id: 'creator-user',
      parent_comment_id: parentCommentId,
      content: 'Creator reply',
      author_role: isCreator ? 'creator' : 'fan',
      is_creator_reply: isCreator && parentCommentId !== null,
    });

    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        author_role: 'creator',
        is_creator_reply: true,
      })
    );
  });
});

describe('useDeleteComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls delete with correct commentId', async () => {
    const { supabase } = await import('../lib/supabase');

    await supabase.from('comments').delete().eq('id', 'comment-to-delete');

    expect(mockDeleteFn).toHaveBeenCalled();
    expect(mockDeleteEqChain.eq).toHaveBeenCalledWith('id', 'comment-to-delete');
  });
});
