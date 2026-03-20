import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PostWithNickname } from './useFanFeed';

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onMutate: async (postId: string) => {
      // Snapshot all matching fanFeed queries for rollback
      const queries = queryClient.getQueriesData<InfiniteData<PostWithNickname[]>>({
        queryKey: ['fanFeed'],
      });

      const snapshots: Array<{
        queryKey: unknown[];
        data: InfiniteData<PostWithNickname[]> | undefined;
      }> = [];

      for (const [queryKey, data] of queries) {
        // Cancel outgoing fetches
        await queryClient.cancelQueries({ queryKey: queryKey as string[] });

        // Store snapshot
        snapshots.push({ queryKey: queryKey as unknown[], data });

        // Optimistically remove the post
        if (data) {
          queryClient.setQueryData<InfiniteData<PostWithNickname[]>>(
            queryKey as string[],
            {
              ...data,
              pages: data.pages.map((page) =>
                page.filter((post) => post.id !== postId)
              ),
            }
          );
        }
      }

      return { snapshots };
    },
    onError: (_err, _postId, context) => {
      // Restore snapshots on error
      if (context?.snapshots) {
        for (const { queryKey, data } of context.snapshots) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fanFeed'] });
    },
  });
}
