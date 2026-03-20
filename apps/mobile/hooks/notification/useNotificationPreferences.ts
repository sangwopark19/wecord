import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export interface NotificationPreferences {
  creator_posts: boolean;
  comments: boolean;
  likes: boolean;
  notices: boolean;
}

const defaultPreferences: NotificationPreferences = {
  creator_posts: true,
  comments: true,
  likes: true,
  notices: true,
};

export function useNotificationPreferences(communityId: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<NotificationPreferences>({
    queryKey: ['notification_preferences', user?.id, communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('creator_posts, comments, likes, notices')
        .eq('user_id', user!.id)
        .eq('community_id', communityId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No row found — return defaults
        return defaultPreferences;
      }
      if (error) throw error;
      return data as NotificationPreferences;
    },
    enabled: !!user?.id && !!communityId,
  });

  const mutation = useMutation({
    mutationFn: async ({
      column,
      value,
    }: {
      column: keyof NotificationPreferences;
      value: boolean;
    }) => {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: user!.id,
            community_id: communityId,
            ...defaultPreferences,
            ...(query.data ?? {}),
            [column]: value,
          },
          { onConflict: 'user_id,community_id' }
        );
      if (error) throw error;
    },
    onMutate: async ({ column, value }) => {
      const queryKey = ['notification_preferences', user?.id, communityId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationPreferences>(queryKey);

      queryClient.setQueryData<NotificationPreferences>(queryKey, (old) => ({
        ...(old ?? defaultPreferences),
        [column]: value,
      }));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['notification_preferences', user?.id, communityId],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification_preferences', user?.id, communityId],
      });
    },
  });

  const updatePreference = (column: keyof NotificationPreferences, value: boolean) => {
    mutation.mutate({ column, value });
  };

  return {
    preferences: query.data ?? defaultPreferences,
    isLoading: query.isLoading,
    updatePreference,
  };
}
