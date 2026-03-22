import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Platform, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface CreatePostParams {
  communityId: string;
  content: string;
  mediaUris: string[];
  postType: 'text' | 'image' | 'video';
  authorRole?: 'fan' | 'creator';
}

async function compressAndUploadImage(
  uri: string,
  path: string
): Promise<string> {
  const compressed = await manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );

  let uploadData: ArrayBuffer | Blob;

  if (Platform.OS === 'web') {
    const response = await fetch(compressed.uri);
    uploadData = await response.blob();
  } else {
    const base64 = await readAsStringAsync(compressed.uri, { encoding: 'base64' });
    uploadData = decode(base64);
  }

  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, uploadData, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('post-media')
    .getPublicUrl(path);

  return publicData.publicUrl;
}

async function uploadVideo(uri: string, path: string): Promise<string> {
  let uploadData: ArrayBuffer | Blob;

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    uploadData = await response.blob();
  } else {
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    uploadData = decode(base64);
  }

  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, uploadData, { contentType: 'video/mp4', upsert: false });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('post-media')
    .getPublicUrl(path);

  return publicData.publicUrl;
}

export function useCreatePost() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ communityId, content, mediaUris, postType, authorRole = 'fan' }: CreatePostParams) => {
      if (!user) throw new Error('Not authenticated');

      let uploadedUrls: string[] = [];

      if (mediaUris.length > 0) {
        try {
          const uploadPromises = mediaUris.map((uri, index) => {
            const timestamp = Date.now();
            if (postType === 'video') {
              const path = `communities/${communityId}/${user.id}/${timestamp}_${index}.mp4`;
              return uploadVideo(uri, path);
            } else {
              const path = `communities/${communityId}/${user.id}/${timestamp}_${index}.jpg`;
              return compressAndUploadImage(uri, path);
            }
          });

          uploadedUrls = await Promise.all(uploadPromises);
        } catch {
          Alert.alert('업로드 실패', '이미지 업로드에 실패했어요. 다시 시도해주세요.');
          throw new Error('imageUpload');
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          community_id: communityId,
          author_id: user.id,
          content,
          media_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
          post_type: postType,
          author_role: authorRole,
        })
        .select()
        .single();

      if (error) {
        Alert.alert('발행 실패', '게시글 발행에 실패했어요. 다시 시도해주세요.');
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fanFeed', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['creatorFeed', variables.communityId] });

      // Async moderation — fire and forget (D-19: never block post creation)
      if (data?.id) {
        supabase.functions.invoke('moderate', {
          body: {
            target_id: data.id,
            target_type: 'post',
            content: variables.content,
            author_id: user?.id,
          },
        }).catch(() => {}); // Silently ignore moderation errors
      }
    },
  });
}
