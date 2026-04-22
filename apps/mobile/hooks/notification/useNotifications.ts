import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export interface Notification {
  id: string;
  type: 'creator_post' | 'comment' | 'like' | 'notice' | 'member_post' | 'system' | 'live';
  title: string;
  body: string;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(communityId: string) {
  const { user } = useAuthStore();

  return useQuery<Notification[]>({
    queryKey: ['notifications', user?.id, communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, data, is_read, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!communityId && !!user,
  });
}
