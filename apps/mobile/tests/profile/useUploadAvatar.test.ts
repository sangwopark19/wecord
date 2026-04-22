import { describe, it, expect, vi, beforeEach } from 'vitest';

const manipulateAsync = vi.fn(async () => ({ uri: 'file:///tmp/compressed.jpg' }));
vi.mock('expo-image-manipulator', () => ({
  manipulateAsync,
  SaveFormat: { JPEG: 'jpeg' },
}));

const getInfoAsync = vi.fn(async () => ({ exists: true, size: 500_000 }));
const readAsStringAsync = vi.fn(async () => 'BASE64DATA');
vi.mock('expo-file-system/legacy', () => ({
  getInfoAsync,
  readAsStringAsync,
}));

vi.mock('base64-arraybuffer', () => ({
  decode: () => new ArrayBuffer(8),
}));

const uploadFn = vi.fn(
  async (_path: string, _data: unknown, _opts: { contentType: string; upsert: boolean }) => ({
    data: { path: 'x' },
    error: null,
  })
);
const getPublicUrlFn = vi.fn(() => ({ data: { publicUrl: 'https://cdn/avatar.jpg' } }));
const storageFromFn = vi.fn(() => ({ upload: uploadFn, getPublicUrl: getPublicUrlFn }));
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: { from: storageFromFn },
  },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ id: 'user-1' })),
}));

// Vitest runs in jsdom (Platform.OS === 'web'), so the hook takes the web
// branch: fetch(compressed.uri) → blob. We stub global.fetch to return a Blob
// of the desired size for size-cap assertions.
const makeBlob = (bytes: number) => {
  // jsdom Blob accepts ArrayBuffer chunks
  return new Blob([new ArrayBuffer(bytes)], { type: 'image/jpeg' });
};

let blobSize = 500_000;

beforeEach(() => {
  vi.clearAllMocks();
  blobSize = 500_000;
  // @ts-expect-error stubbed for test
  global.fetch = vi.fn(async () => ({
    blob: async () => makeBlob(blobSize),
  }));
});

describe('useUploadAvatar / uploadAvatar', () => {
  it('resizes to 512x512 JPEG with compress 0.8', async () => {
    const { uploadAvatar } = await import('../../hooks/profile/useUploadAvatar');
    await uploadAvatar('user-1', 'file:///photo.jpg');
    expect(manipulateAsync).toHaveBeenCalledWith(
      'file:///photo.jpg',
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.8, format: 'jpeg' }
    );
  });

  it('uploads to avatars bucket at {userId}/avatar-{ts}.jpg with upsert:true', async () => {
    const { uploadAvatar } = await import('../../hooks/profile/useUploadAvatar');
    await uploadAvatar('user-1', 'file:///photo.jpg');
    expect(storageFromFn).toHaveBeenCalledWith('avatars');
    expect(uploadFn).toHaveBeenCalled();
    const [path, , opts] = uploadFn.mock.calls[0];
    expect(typeof path).toBe('string');
    expect(path).toMatch(/^user-1\/avatar-\d+\.jpg$/);
    expect(opts).toMatchObject({ contentType: 'image/jpeg', upsert: true });
  });

  it('returns public URL from supabase.storage.getPublicUrl', async () => {
    const { uploadAvatar } = await import('../../hooks/profile/useUploadAvatar');
    const url = await uploadAvatar('user-1', 'file:///photo.jpg');
    expect(url).toBe('https://cdn/avatar.jpg');
  });

  it('rejects non-image MIME (T-7-04 allowlist)', async () => {
    const { uploadAvatar } = await import('../../hooks/profile/useUploadAvatar');
    await expect(uploadAvatar('user-1', 'file:///foo.pdf')).rejects.toThrow(/MIME/);
  });

  it('rejects files over 2MB after compression on web (T-7-04 size cap)', async () => {
    blobSize = 3_000_000;
    const { uploadAvatar } = await import('../../hooks/profile/useUploadAvatar');
    await expect(uploadAvatar('user-1', 'file:///photo.jpg')).rejects.toThrow(/too large/);
  });
});
