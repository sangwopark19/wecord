import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { PostWithNickname } from '../post/useFanFeed';

interface Cursor {
  createdAt: string;
  id: string;
}

interface HomeFeedResponse {
  posts: Omit<PostWithNickname, 'isLiked'>[];
  nextCursor: Cursor | null;
  isEmpty: boolean;
}

async function fetchLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .eq('user_id', userId)
    .eq('target_type', 'post')
    .in('target_id', postIds);

  if (!data) return new Set();
  return new Set(data.map((row: { target_id: string }) => row.target_id));
}

export function useMyMemberships(userId: string | undefined) {
  return useQuery({
    queryKey: ['myMemberships', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((row: { community_id: string }) => row.community_id) as string[];
    },
    enabled: !!userId,
  });
}

export function useHomeFeed() {
  const { user } = useAuthStore();
  const { data: memberships } = useMyMemberships(user?.id);

  const isNewUser = memberships !== undefined && memberships.length === 0;

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['homeFeed', user?.id],
    initialPageParam: null as Cursor | null,
    queryFn: async ({ pageParam }) => {
      if (!user) return [] as PostWithNickname[];

      const { data, error } = await supabase.functions.invoke('home-feed', {
        body: { cursor: pageParam ?? undefined, limit: 15 },
      });

      if (error) throw error;

      const response = data as HomeFeedResponse;
      if (response.isEmpty || !response.posts) return [] as PostWithNickname[];

      const posts = response.posts;
      const postIds = posts.map((p) => p.id);
      const likedSet = await fetchLikedPostIds(user.id, postIds);

      return posts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
      })) as PostWithNickname[];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 15) return undefined;
      const last = lastPage[lastPage.length - 1];
      if (!last) return undefined;
      return { createdAt: last.created_at, id: last.id } satisfies Cursor;
    },
    enabled: !!user && !isNewUser && memberships !== undefined,
  });

  return {
    ...infiniteQuery,
    isNewUser,
    memberships,
  };
}
