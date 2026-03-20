import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export interface CommunityMember {
  id: string;
  user_id: string;
  community_id: string;
  community_nickname: string;
  role: 'member' | 'creator' | 'admin';
  follower_count: number;
  following_count: number;
  joined_at: string;
}

export function useCommunityMember(communityId: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['communityMember', communityId],
    queryFn: async (): Promise<CommunityMember | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found — not a member
          return null;
        }
        throw error;
      }

      return data as CommunityMember;
    },
    enabled: !!user && !!communityId,
  });
}
