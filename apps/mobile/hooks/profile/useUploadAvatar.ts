import { useMutation } from '@tanstack/react-query';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { readAsStringAsync, getInfoAsync } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES_AFTER_COMPRESSION = 2 * 1024 * 1024; // 2 MB (T-7-04)

function inferMimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  // Strip query params if any
  const path = lower.split('?')[0];
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  // Untagged URI — for expo-image-picker, the picker enforces image-only when
  // mediaTypes=Images, so an asset without an extension is still an image.
  // We accept it ONLY if no other extension is detected; for unknown
  // extensions (pdf/mp4/...) we return 'unknown' so the allowlist rejects.
  const dot = path.lastIndexOf('.');
  if (dot >= 0) {
    const ext = path.slice(dot);
    // Unknown extension that is NOT a recognized image — treat as not allowed.
    if (ext.length <= 6) return 'unknown';
  }
  return 'image/jpeg';
}

/**
 * Resize-compress to 512x512 JPEG (q=0.8) and upload to the `avatars` bucket
 * under {userId}/avatar-{ts}.jpg. Returns the public URL.
 *
 * T-7-04 mitigations (storage DoS):
 *   - MIME allowlist (jpeg/png/webp). Client-side reject pre-upload.
 *   - 2 MB cap on compressed output. Bucket-level RLS is the server boundary;
 *     this is defense-in-depth and a friendlier UX than a 4xx from storage.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const mime = inferMimeFromUri(localUri);
  if (!ALLOWED_MIME.includes(mime)) {
    throw new Error(`Avatar MIME type not allowed: ${mime}`);
  }

  const compressed = await manipulateAsync(
    localUri,
    [{ resize: { width: 512, height: 512 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );

  // Size check after compression — getInfoAsync returns size on native by default.
  if (Platform.OS !== 'web') {
    const info = await getInfoAsync(compressed.uri);
    if (
      info.exists &&
      typeof (info as { size?: number }).size === 'number' &&
      (info as { size: number }).size > MAX_BYTES_AFTER_COMPRESSION
    ) {
      throw new Error('Avatar too large after compression');
    }
  }

  let uploadData: ArrayBuffer | Blob;
  if (Platform.OS === 'web') {
    const response = await fetch(compressed.uri);
    const blob = await response.blob();
    if (blob.size > MAX_BYTES_AFTER_COMPRESSION) {
      throw new Error('Avatar too large after compression');
    }
    uploadData = blob;
  } else {
    const base64 = await readAsStringAsync(compressed.uri, { encoding: 'base64' });
    uploadData = decode(base64);
  }

  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from('avatars').upload(path, uploadData, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
  return publicData.publicUrl;
}

export function useUploadAvatar() {
  const user = useAuthStore((s) => s.user);

  return useMutation<string, Error, string>({
    mutationFn: async (localUri: string) => {
      if (!user) throw new Error('unauthenticated');
      return uploadAvatar(user.id, localUri);
    },
  });
}
