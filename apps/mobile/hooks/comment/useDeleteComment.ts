import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface DeleteCommentParams {
  commentId: string;
  postId: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: DeleteCommentParams) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },

    onSuccess: (_data, { postId }: DeleteCommentParams) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      // Refresh post to update comment_count
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
