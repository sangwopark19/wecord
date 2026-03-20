import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Notification } from './useNotifications';

export function useMarkNotificationRead(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId: string) => {
      // Optimistic update: immediately set is_read in cache
      await queryClient.cancelQueries({ queryKey: ['notifications', communityId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', communityId]);

      queryClient.setQueryData<Notification[]>(['notifications', communityId], (old) =>
        (old ?? []).map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', communityId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', communityId] });
    },
  });
}

export function useMarkAllRead(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('community_id', communityId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', communityId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', communityId]);

      queryClient.setQueryData<Notification[]>(['notifications', communityId], (old) =>
        (old ?? []).map((n) => ({ ...n, is_read: true }))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', communityId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', communityId] });
    },
  });
}
