import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { type FollowMember } from './useFollowerList';

export function useFollowingList(memberId: string) {
  return useQuery({
    queryKey: ['followingList', memberId],
    queryFn: async (): Promise<FollowMember[]> => {
      const { data, error } = await supabase
        .from('community_follows')
        .select('following_cm_id, community_members!community_follows_following_cm_id_fkey(id, community_nickname, avatar_url)')
        .eq('follower_cm_id', memberId);

      if (error) throw error;
      if (!data) return [];

      return data.map((row) => {
        const member = row.community_members as unknown as FollowMember | null;
        return {
          id: member?.id ?? row.following_cm_id,
          community_nickname: member?.community_nickname ?? '',
          avatar_url: member?.avatar_url ?? null,
        };
      });
    },
    enabled: !!memberId,
  });
}
