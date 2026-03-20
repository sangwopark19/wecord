import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export interface CommentAuthor {
  id: string;
  community_nickname: string;
  role: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  artist_member_id: string | null;
  parent_comment_id: string | null;
  content: string;
  content_rating: string | null;
  author_role: 'fan' | 'creator';
  is_creator_reply: boolean;
  like_count: number;
  created_at: string;
  author: CommentAuthor;
  isLiked: boolean;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

function buildCommentThread(
  flatComments: Comment[]
): CommentWithReplies[] {
  const rootComments: CommentWithReplies[] = [];
  const replyMap = new Map<string, Comment[]>();

  for (const comment of flatComments) {
    if (comment.parent_comment_id === null) {
      rootComments.push({ ...comment, replies: [] });
    } else {
      const arr = replyMap.get(comment.parent_comment_id) ?? [];
      arr.push(comment);
      replyMap.set(comment.parent_comment_id, arr);
    }
  }

  for (const root of rootComments) {
    root.replies = replyMap.get(root.id) ?? [];
  }

  return rootComments;
}

export function useComments(postId: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<{ rootComments: CommentWithReplies[] }> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:community_members!inner(community_nickname, id, role)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rawComments = (data ?? []) as Omit<Comment, 'isLiked'>[];

      // Batch-fetch liked comment IDs for current user
      let likedSet = new Set<string>();
      if (user && rawComments.length > 0) {
        const commentIds = rawComments.map((c) => c.id);
        const { data: likeData } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds);

        likedSet = new Set((likeData ?? []).map((l) => l.target_id));
      }

      const comments: Comment[] = rawComments.map((c) => ({
        ...c,
        isLiked: likedSet.has(c.id),
      }));

      return { rootComments: buildCommentThread(comments) };
    },
    enabled: !!postId,
  });
}
