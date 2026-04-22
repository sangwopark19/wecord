import { describe, it } from 'vitest';

describe('useUploadAvatar', () => {
  it.todo('resizes to 512x512 via manipulateAsync with compress 0.8 JPEG');
  it.todo('uploads to avatars bucket at {userId}/avatar-{timestamp}.jpg with upsert:true');
  it.todo('returns public URL from supabase.storage.getPublicUrl');
  it.todo(
    'rejects non-image MIME per UI-SPEC image/jpeg|png|webp allowlist (T-7-04: storage DoS mitigation)'
  );
  it.todo('rejects files over 2MB after compression (T-7-04: size cap)');
});
