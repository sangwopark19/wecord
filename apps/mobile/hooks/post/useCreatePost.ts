import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface CreatePostParams {
  communityId: string;
  content: string;
  mediaUris: string[];
  postType: 'text' | 'image' | 'video';
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

  const response = await fetch(compressed.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('post-media')
    .getPublicUrl(path);

  return publicData.publicUrl;
}

async function uploadVideo(uri: string, path: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, blob, { contentType: 'video/mp4', upsert: false });

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
    mutationFn: async ({ communityId, content, mediaUris, postType }: CreatePostParams) => {
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
          author_role: 'fan',
        })
        .select()
        .single();

      if (error) {
        Alert.alert('발행 실패', '게시글 발행에 실패했어요. 다시 시도해주세요.');
        throw error;
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fanFeed', variables.communityId] });
    },
  });
}
