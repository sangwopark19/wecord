import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { shouldSkipMutation, buildUpdateFilter, buildUpdatePayload } from './notifyHelpers';

// DMPL-02 / D-28 / T-7-06.
//
// notify() flips profiles.dm_launch_notify=true. Pitfall 10: if already true,
// surface a friendly toast instead of re-writing. RLS profiles_update_own
// (existing from Phase 1) enforces the server-side guard; the client also
// scopes the .eq filter to the caller's user.id (defense in depth — T-7-06).
//
// On success: optimistically updates the local Profile in authStore and
// invalidates ['profile', userId] so any other consumer refreshes.
export function useDmLaunchNotify() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('unauthenticated');
      const [filterCol, filterVal] = buildUpdateFilter(user.id);
      const { error } = await supabase
        .from('profiles')
        .update(buildUpdatePayload())
        .eq(filterCol, filterVal);
      if (error) throw error;
    },
    onSuccess: () => {
      if (profile) setProfile({ ...profile, dmLaunchNotify: true });
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const notify = async () => {
    if (shouldSkipMutation({ alreadyNotified: !!profile?.dmLaunchNotify })) {
      Alert.alert('', t('dm:alreadyNotifiedToast'));
      return;
    }
    try {
      await mutation.mutateAsync();
    } catch (err) {
      console.warn('[DM] notify failed', err);
      Alert.alert('', t('dm:alreadyNotifiedToast'));
    }
  };

  return {
    notify,
    isPending: mutation.isPending,
    isNotified: !!profile?.dmLaunchNotify,
  };
}
