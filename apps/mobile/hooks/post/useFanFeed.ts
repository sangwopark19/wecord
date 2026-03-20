import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useCommunityMember } from '../community/useCommunityMember';

export interface PostWithNickname {
  id: string;
  community_id: string;
  author_id: string;
  artist_member_id: string | null;
  author_role: 'fan' | 'creator';
  content: string;
  content_rating: string | null;
  media_urls: string[] | null;
  post_type: 'text' | 'image' | 'video';
  like_count: number;
  comment_count: number;
  created_at: string;
  author_nickname: string;
  author_cm_id: string;
  artist_member_name: string | null;
  community_name: string;
  community_slug: string;
  isLiked: boolean;
}

type SortOption = 'latest' | 'popular';
type FilterOption = 'all' | 'following' | 'hot';

type LatestCursor = { createdAt: string; id: string };
type PopularCursor = number;

const PAGE_SIZE = 15;
const HOT_THRESHOLD = 10;

async function fetchFollowingCmIds(myCmId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('community_follows')
    .select('following_cm_id')
    .eq('follower_cm_id', myCmId);

  if (error || !data) return [];
  return data.map((row) => row.following_cm_id);
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
  return new Set(data.map((row) => row.target_id));
}

export function useFanFeed(
  communityId: string,
  sort: SortOption,
  filter: FilterOption
) {
  const { user } = useAuthStore();
  const { data: membership } = useCommunityMember(communityId);

  return useInfiniteQuery({
    queryKey: ['fanFeed', communityId, sort, filter],
    initialPageParam: null as LatestCursor | PopularCursor | null,
    queryFn: async ({ pageParam }) => {
      if (!user) return [];

      // Handle following filter — need following list
      let followingCmIds: string[] = [];
      if (filter === 'following') {
        if (!membership?.id) return [];
        followingCmIds = await fetchFollowingCmIds(membership.id);
        if (followingCmIds.length === 0) return [];
      }

      let query = supabase
        .from('posts_with_nickname')
        .select('*')
        .eq('community_id', communityId)
        .eq('author_role', 'fan');

      // Apply filter
      if (filter === 'following') {
        query = query.in('author_cm_id', followingCmIds);
      } else if (filter === 'hot') {
        query = query.gte('like_count', HOT_THRESHOLD);
      }

      if (sort === 'latest') {
        query = query
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });

        if (pageParam && typeof pageParam === 'object') {
          const cursor = pageParam as LatestCursor;
          query = query.or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
          );
        }

        query = query.limit(PAGE_SIZE);
      } else {
        // popular — offset pagination, capped at 3 pages
        const page = typeof pageParam === 'number' ? pageParam : 0;
        query = query
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      }

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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (sort === 'popular') {
        const page = typeof lastPageParam === 'number' ? lastPageParam : 0;
        if (page >= 2 || lastPage.length < PAGE_SIZE) return undefined;
        return page + 1;
      }

      // latest — cursor-based
      if (lastPage.length < PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      if (!last) return undefined;
      return { createdAt: last.created_at, id: last.id } satisfies LatestCursor;
    },
    enabled: !!user && !!communityId,
  });
}
