import { useMutation, useQueryClient, type QueryKey, type InfiniteData } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { PostWithNickname } from './useFanFeed';

interface LikeParams {
  targetId: string;
  isLiked: boolean;
  userId: string;
  feedQueryKey: QueryKey;
}

type FeedData = InfiniteData<PostWithNickname[]>;

export function useLike(targetType: 'post' | 'comment') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetId, isLiked, userId }: LikeParams) => {
      if (isLiked) {
        // Currently liked → unlike (DELETE)
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('target_type', targetType)
          .eq('target_id', targetId);

        if (error) throw error;
      } else {
        // Not liked → like (INSERT)
        const { error } = await supabase.from('likes').insert({
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
        });

        // 23505 = unique_violation (already liked) — ignore gracefully
        if (error && error.code !== '23505') throw error;
      }
    },

    onMutate: async ({ targetId, isLiked, feedQueryKey }: LikeParams) => {
      if (targetType === 'post') {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: feedQueryKey });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData<FeedData>(feedQueryKey);

        // Optimistically update like_count and isLiked in feed cache
        queryClient.setQueryData<FeedData>(feedQueryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((post) => {
                if (post.id !== targetId) return post;
                return {
                  ...post,
                  isLiked: !isLiked,
                  like_count: isLiked
                    ? Math.max(0, post.like_count - 1)
                    : post.like_count + 1,
                };
              })
            ),
          };
        });

        // Also update single post cache if present
        const postQueryKey = ['post', targetId];
        const previousPost = queryClient.getQueryData<PostWithNickname>(postQueryKey);
        if (previousPost) {
          queryClient.setQueryData<PostWithNickname>(postQueryKey, {
            ...previousPost,
            isLiked: !isLiked,
            like_count: isLiked
              ? Math.max(0, previousPost.like_count - 1)
              : previousPost.like_count + 1,
          });
        }

        return { previousData, previousPost };
      } else {
        // comment like — feedQueryKey is the comments query key
        await queryClient.cancelQueries({ queryKey: feedQueryKey });
        // Comment optimistic update is handled at the comment cache level
        return {};
      }
    },

    onError: (_err, _variables, context) => {
      const ctx = context as
        | { previousData?: FeedData; previousPost?: PostWithNickname }
        | undefined;

      if (ctx?.previousData !== undefined) {
        // Restore feed cache
        const { feedQueryKey } = _variables;
        queryClient.setQueryData(feedQueryKey, ctx.previousData);
      }
      if (ctx?.previousPost !== undefined) {
        const postQueryKey = ['post', _variables.targetId];
        queryClient.setQueryData(postQueryKey, ctx.previousPost);
      }
    },

    onSettled: (_data, _err, { feedQueryKey }: LikeParams) => {
      // Sync with server after mutation settles
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
  });
}
