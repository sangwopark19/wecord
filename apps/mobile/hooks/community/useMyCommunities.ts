import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export interface JoinedCommunity {
  communityId: string;
  communityName: string;
  communitySlug: string;
  coverImageUrl: string | null;
  myCommunityNickname: string;
  joinedAt: string;
}

interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
}

interface MembershipRow {
  community_nickname: string;
  joined_at: string;
  // PostgREST inner-join may return either an array or a single object depending on cardinality.
  communities: CommunityRow | CommunityRow[] | null;
}

function pickCommunity(rel: CommunityRow | CommunityRow[] | null): CommunityRow | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/**
 * Hook returning communities the current user has joined, ordered by most recent first.
 *
 * Uses an `!inner` join to require a matching community row (filters out orphans).
 * Phase 06 pattern (`profilesArr?.[0]` normalization for inner-join arrays) applied
 * here for `communities` since PostgREST returns an array shape via supabase-js.
 */
export function useMyCommunities() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery<JoinedCommunity[]>({
    queryKey: ['myCommunities', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select(
          'community_nickname, joined_at, communities!inner(id, name, slug, cover_image_url)'
        )
        .eq('user_id', userId!)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as unknown as MembershipRow[];

      return rows
        .map((row) => {
          const c = pickCommunity(row.communities);
          if (!c) return null;
          return {
            communityId: c.id,
            communityName: c.name,
            communitySlug: c.slug,
            coverImageUrl: c.cover_image_url,
            myCommunityNickname: row.community_nickname,
            joinedAt: row.joined_at,
          } satisfies JoinedCommunity;
        })
        .filter((x): x is JoinedCommunity => x !== null);
    },
  });
}
