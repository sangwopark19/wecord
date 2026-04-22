import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface JoinCommunityParams {
  communityId: string;
  nickname: string;
}

async function generateNickname(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-nickname');
    if (error || !data?.nickname) {
      // Fallback: generate locally
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `User#${randomNum}`;
    }
    return data.nickname as string;
  } catch {
    // Network-level error (connection refused, DNS failure) — generate locally
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `User#${randomNum}`;
  }
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ communityId, nickname }: JoinCommunityParams) => {
      if (!user) throw new Error('Not authenticated');

      // INSERT without RETURNING to avoid SELECT RLS policy evaluation
      // within the same statement (causes 42501 because is_community_member()
      // cannot see the just-inserted row during the same statement).
      const { error: insertError } = await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          community_id: communityId,
          community_nickname: nickname,
          role: 'member',
        });

      if (insertError) {
        if (insertError.code === '23505') {
          // Determine if this is an already-member violation or a nickname collision
          const isAlreadyMember =
            insertError.message?.includes('cm_user_community') ||
            (insertError.details as string | undefined)?.includes('cm_user_community') ||
            insertError.message?.includes('idx_cm_user_community');
          if (isAlreadyMember) {
            // Already a member — fetch and return existing membership
            const { data: existing, error: existingError } = await supabase
              .from('community_members')
              .select()
              .eq('community_id', communityId)
              .eq('user_id', user.id)
              .single();
            if (existingError) throw existingError;
            if (existing) return existing;
          }
          // Nickname collision — retry with new nickname
          const newNickname = await generateNickname();
          const { error: retryError } = await supabase
            .from('community_members')
            .insert({
              user_id: user.id,
              community_id: communityId,
              community_nickname: newNickname,
              role: 'member',
            });
          if (retryError) throw retryError;
        } else {
          throw insertError;
        }
      }

      // Fetch the inserted row in a separate statement (RLS now sees the committed row)
      const { data: member, error: fetchError } = await supabase
        .from('community_members')
        .select()
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();
      if (fetchError) throw fetchError;
      return member;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['communityMember', variables.communityId],
      });
    },
  });
}

export { generateNickname };
