import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface FollowMemberParams {
  followerCmId: string;
  followingCmId: string;
  isFollowing: boolean;
  communityId?: string;
}

export function useFollowMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      followerCmId,
      followingCmId,
      isFollowing,
    }: FollowMemberParams) => {
      if (isFollowing) {
        // Unfollow: DELETE from community_follows
        const { error } = await supabase
          .from('community_follows')
          .delete()
          .eq('follower_cm_id', followerCmId)
          .eq('following_cm_id', followingCmId);

        if (error) throw error;
      } else {
        // Follow: INSERT into community_follows
        const { error } = await supabase
          .from('community_follows')
          .insert({
            follower_cm_id: followerCmId,
            following_cm_id: followingCmId,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      if (variables.communityId) {
        queryClient.invalidateQueries({ queryKey: ['artistMembers', variables.communityId] });
        queryClient.invalidateQueries({ queryKey: ['communityMember', variables.communityId] });
      }
      queryClient.invalidateQueries({ queryKey: ['communityProfile', variables.followingCmId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['followerList'] });
      queryClient.invalidateQueries({ queryKey: ['followingList'] });
    },
  });
}

export function useIsFollowing(followerCmId: string, followingCmId: string) {
  return useQuery({
    queryKey: ['isFollowing', followerCmId, followingCmId],
    queryFn: async (): Promise<boolean> => {
      const { data } = await supabase
        .from('community_follows')
        .select('id')
        .eq('follower_cm_id', followerCmId)
        .eq('following_cm_id', followingCmId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!followerCmId && !!followingCmId,
  });
}
