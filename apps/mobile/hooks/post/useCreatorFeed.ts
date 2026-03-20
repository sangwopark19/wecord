import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { PostWithNickname } from './useFanFeed';

// RLS enforcement note: The posts_insert_member policy in the DB enforces that
// only users with community_members.role='creator' can insert posts with author_role='creator'.
// This view query reads creator posts but the write restriction exists at the DB level.

const PAGE_SIZE = 15;

type LatestCursor = { createdAt: string; id: string };

async function fetchLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .eq('user_id', userId)
    .eq('target_type', 'post')
    .in('target_id', postIds);

  if (!data) return new Set();
  return new Set(data.map((row) => row.target_id));
}

export function useCreatorFeed(communityId: string, artistMemberId: string | null) {
  const { user } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ['creatorFeed', communityId, artistMemberId],
    initialPageParam: null as LatestCursor | null,
    queryFn: async ({ pageParam }) => {
      if (!user) return [];

      let query = supabase
        .from('posts_with_nickname')
        .select('*')
        .eq('community_id', communityId)
        .eq('author_role', 'creator');

      // Filter by specific artist member if selected
      if (artistMemberId !== null) {
        query = query.eq('artist_member_id', artistMemberId);
      }

      // Cursor-based pagination, latest sort (created_at DESC, id DESC)
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      if (pageParam) {
        const cursor = pageParam as LatestCursor;
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        );
      }

      query = query.limit(PAGE_SIZE);

      const { data, error } = await query;
      if (error) throw error;

      const posts = (data ?? []) as Omit<PostWithNickname, 'isLiked'>[];

      // Batch fetch likes
      const postIds = posts.map((p) => p.id);
      const likedSet = await fetchLikedPostIds(user.id, postIds);

      return posts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
      })) as PostWithNickname[];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      if (!last) return undefined;
      return { createdAt: last.created_at, id: last.id } satisfies LatestCursor;
    },
    enabled: !!user && !!communityId,
  });
}
