import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface LeaveCommunityParams {
  membershipId: string;
  communityId: string;
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ membershipId }: LeaveCommunityParams) => {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['communityMember', variables.communityId],
      });
      router.replace('/(community)/search' as never);
    },
  });
}
