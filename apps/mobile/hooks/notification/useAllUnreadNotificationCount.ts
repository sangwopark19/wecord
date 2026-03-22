import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function useAllUnreadNotificationCount(userId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Initial count: query all unread notifications for user (no community filter)
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then(({ count: initialCount }) => {
        setCount(initialCount ?? 0);
      });

    // Realtime subscription: listen for INSERT and UPDATE events on notifications
    const channel = supabase
      .channel(`user:${userId}:notifications:all`)
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
  }, [userId]);

  return count;
}
