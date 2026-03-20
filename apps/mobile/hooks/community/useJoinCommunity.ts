import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface JoinCommunityParams {
  communityId: string;
  nickname: string;
}

async function generateNickname(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-nickname');
  if (error || !data?.nickname) {
    // Fallback: generate locally
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `User#${randomNum}`;
  }
  return data.nickname as string;
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ communityId, nickname }: JoinCommunityParams) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          community_id: communityId,
          community_nickname: nickname,
          role: 'member',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Nickname collision — retry with new nickname
          const newNickname = await generateNickname();
          const { data: retryData, error: retryError } = await supabase
            .from('community_members')
            .insert({
              user_id: user.id,
              community_id: communityId,
              community_nickname: newNickname,
              role: 'member',
            })
            .select()
            .single();
          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['communityMember', variables.communityId],
      });
    },
  });
}

export { generateNickname };
