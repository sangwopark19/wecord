import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface FollowMember {
  id: string;
  community_nickname: string;
  avatar_url: string | null;
}

export function useFollowerList(memberId: string) {
  return useQuery({
    queryKey: ['followerList', memberId],
    queryFn: async (): Promise<FollowMember[]> => {
      const { data, error } = await supabase
        .from('community_follows')
        .select('follower_cm_id, community_members!community_follows_follower_cm_id_fkey(id, community_nickname, avatar_url)')
        .eq('following_cm_id', memberId);

      if (error) throw error;
      if (!data) return [];

      return data.map((row) => {
        const member = row.community_members as unknown as FollowMember | null;
        return {
          id: member?.id ?? row.follower_cm_id,
          community_nickname: member?.community_nickname ?? '',
          avatar_url: member?.avatar_url ?? null,
        };
      });
    },
    enabled: !!memberId,
  });
}
