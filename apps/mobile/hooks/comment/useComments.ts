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

interface RawCommentRow {
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
  author_nickname: string;
  author_cm_id: string;
  member_role: string;
}

export function useComments(postId: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<{ rootComments: CommentWithReplies[] }> => {
      // Ensure Supabase client has a valid session before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { rootComments: [] };

      const { data, error } = await supabase
        .from('comments_with_nickname')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as RawCommentRow[];

      if (rows.length === 0) {
        return { rootComments: [] };
      }

      // Batch-fetch liked comment IDs for current user
      let likedSet = new Set<string>();
      if (user) {
        const commentIds = rows.map((c) => c.id);
        const { data: likeData } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds);

        likedSet = new Set((likeData ?? []).map((l) => l.target_id));
      }

      const comments: Comment[] = rows.map((c) => ({
        id: c.id,
        post_id: c.post_id,
        author_id: c.author_id,
        artist_member_id: c.artist_member_id,
        parent_comment_id: c.parent_comment_id,
        content: c.content,
        content_rating: c.content_rating,
        author_role: c.author_role,
        is_creator_reply: c.is_creator_reply,
        like_count: c.like_count,
        created_at: c.created_at,
        author: {
          id: c.author_cm_id,
          community_nickname: c.author_nickname,
          role: c.member_role,
        },
        isLiked: likedSet.has(c.id),
      }));

      return { rootComments: buildCommentThread(comments) };
    },
    enabled: !!postId && !!user,
  });
}
