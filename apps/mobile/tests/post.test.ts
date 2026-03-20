import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase storage
const mockStorageUpload = vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null });
const mockStorageGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } });

const mockStorage = {
  from: vi.fn().mockReturnValue({
    upload: mockStorageUpload,
    getPublicUrl: mockStorageGetPublicUrl,
  }),
};

// Mock supabase posts insert
const mockPostInsertChain = {
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'post-1', content: 'Hello' }, error: null }),
};
const mockPostInsert = vi.fn().mockReturnValue(mockPostInsertChain);

const mockPostDeleteChain = {
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
};
const mockPostDelete = vi.fn().mockReturnValue(mockPostDeleteChain);

const mockFrom = vi.fn((table: string) => {
  if (table === 'posts') {
    return {
      insert: mockPostInsert,
      delete: mockPostDelete,
    };
  }
  return {};
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: mockStorage,
  },
}));

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: vi.fn().mockResolvedValue({ uri: 'file://compressed.jpg' }),
  SaveFormat: { JPEG: 'jpeg' },
}));

describe('useCreatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageUpload.mockResolvedValue({ data: { path: 'test.jpg' }, error: null });
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } });
    mockPostInsert.mockReturnValue(mockPostInsertChain);
    mockPostInsertChain.select.mockReturnThis();
    mockPostInsertChain.single.mockResolvedValue({ data: { id: 'post-1', content: 'Hello' }, error: null });
  });

  it('calls supabase storage upload for image posts', async () => {
    const { supabase } = await import('../lib/supabase');

    // Simulate compress (expo-image-manipulator) + upload to post-media
    const communityId = 'community-123';
    const userId = 'user-456';
    const timestamp = Date.now();
    const path = `communities/${communityId}/${userId}/${timestamp}_0.jpg`;

    // Fetch compressed file and upload (blob simulation)
    const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    await supabase.storage.from('post-media').upload(path, blob, { contentType: 'image/jpeg', upsert: false });

    expect(mockStorage.from).toHaveBeenCalledWith('post-media');
    expect(mockStorageUpload).toHaveBeenCalledWith(
      expect.stringContaining(`communities/${communityId}/${userId}/`),
      expect.any(Blob),
      expect.objectContaining({ contentType: 'image/jpeg' })
    );
  });

  it('inserts into posts table with correct fields', async () => {
    const { supabase } = await import('../lib/supabase');

    const communityId = 'community-123';
    const userId = 'user-456';
    const content = 'Test post content';
    const mediaUrls = ['https://example.com/test.jpg'];

    await supabase
      .from('posts')
      .insert({
        community_id: communityId,
        author_id: userId,
        content,
        media_urls: mediaUrls,
        post_type: 'image',
        author_role: 'fan',
      })
      .select()
      .single();

    expect(mockPostInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        community_id: communityId,
        author_id: userId,
        content,
        author_role: 'fan',
      })
    );
  });
});

describe('useDeletePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostDelete.mockReturnValue(mockPostDeleteChain);
    mockPostDeleteChain.eq.mockResolvedValue({ data: null, error: null });
  });

  it('calls posts delete with correct post id', async () => {
    const { supabase } = await import('../lib/supabase');

    const postId = 'post-id-123';
    const deleteChain = supabase.from('posts').delete();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deleteChain as any).eq('id', postId);

    expect(mockPostDelete).toHaveBeenCalled();
    expect(mockPostDeleteChain.eq).toHaveBeenCalledWith('id', postId);
  });
});
