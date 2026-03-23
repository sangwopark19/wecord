import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function useUnreadNotificationCount(userId: string, communityId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId || !communityId) return;

    // Initial count: query notifications table with count: 'exact'
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(`community_id.eq.${communityId},community_id.is.null`)
      .eq('is_read', false)
      .then(({ count: initialCount }) => {
        setCount(initialCount ?? 0);
      });

    // Realtime subscription: listen for INSERT events on notifications
    const channel = supabase
      .channel(`user:${userId}:notifications:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch count on update (mark read)
          supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .or(`community_id.eq.${communityId},community_id.is.null`)
            .eq('is_read', false)
            .then(({ count: newCount }) => {
              setCount(newCount ?? 0);
            });
        }
      )
      .subscribe();

    // CRITICAL: cleanup removes channel on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, communityId]);

  return count;
}
