import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useCommunityMember } from '../community/useCommunityMember';

const MAX_COMMENT_LENGTH = 500;

interface CreateCommentParams {
  postId: string;
  content: string;
  parentCommentId: string | null;
  communityId: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId, communityId }: CreateCommentParams) => {
      if (!user) throw new Error('Not authenticated');

      // Validate length
      if (content.length > MAX_COMMENT_LENGTH) {
        throw new Error(`Comment exceeds ${MAX_COMMENT_LENGTH} characters`);
      }

      if (content.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }

      // Depth guard: fetch parent comment to see if it's already a reply
      if (parentCommentId !== null) {
        const { data: parentComment, error: parentError } = await supabase
          .from('comments')
          .select('parent_comment_id')
          .eq('id', parentCommentId)
          .single();

        if (parentError) throw parentError;

        if (parentComment?.parent_comment_id !== null) {
          Alert.alert('알림', '답글에는 답글을 달 수 없어요. (1단계 답글만 지원)');
          throw new Error('Replies to replies are not supported (1-depth only)');
        }
      }

      // Get current user's community membership role
      const { data: memberData } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      const memberRole = memberData?.role ?? 'member';
      const isCreator = memberRole === 'creator';

      const { data, error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        parent_comment_id: parentCommentId,
        content: content.trim(),
        author_role: isCreator ? 'creator' : 'fan',
        is_creator_reply: isCreator && parentCommentId !== null,
      }).select('id').single();

      if (error) throw error;
      return data;
    },

    onSuccess: (data, { postId, content, communityId }: CreateCommentParams) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      // Also invalidate the post to refresh comment_count
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      // Async moderation — fire and forget (D-19: never block comment creation)
      if (data?.id) {
        supabase.functions.invoke('moderate', {
          body: {
            target_id: data.id,
            target_type: 'comment',
            content,
            author_id: user?.id,
          },
        }).catch(() => {}); // Silently ignore moderation errors
      }
    },
  });
}
