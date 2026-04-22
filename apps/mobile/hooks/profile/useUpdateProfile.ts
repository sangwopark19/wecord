import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore, type Profile } from '../../stores/authStore';

type SupportedLanguage = 'ko' | 'en' | 'th' | 'zh' | 'ja';

export interface UpdateProfileVars {
  globalNickname?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  language?: SupportedLanguage;
  dmLaunchNotify?: boolean;
}

interface UpdatePatch {
  global_nickname?: string;
  bio?: string | null;
  avatar_url?: string | null;
  language?: SupportedLanguage;
  dm_launch_notify?: boolean;
}

interface MutationContext {
  previous: Profile | null;
}

/**
 * Optimistic profile mutation.
 *
 * T-7-03 mitigation: Uses `.eq('user_id', user.id)` so client only attempts
 * self-update. Server enforces `profiles_update_own` RLS as the authoritative
 * boundary — client filter is defense-in-depth, not the trust boundary.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation<Profile, Error, UpdateProfileVars, MutationContext>({
    mutationFn: async (vars) => {
      if (!user || !profile) throw new Error('unauthenticated');

      const patch: UpdatePatch = {};
      if (vars.globalNickname !== undefined) patch.global_nickname = vars.globalNickname;
      if (vars.bio !== undefined) patch.bio = vars.bio;
      if (vars.avatarUrl !== undefined) patch.avatar_url = vars.avatarUrl;
      if (vars.language !== undefined) patch.language = vars.language;
      if (vars.dmLaunchNotify !== undefined) patch.dm_launch_notify = vars.dmLaunchNotify;

      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('user_id', user.id);

      if (error) throw error;

      const next: Profile = {
        ...profile,
        ...(vars.globalNickname !== undefined && { globalNickname: vars.globalNickname }),
        ...(vars.bio !== undefined && { bio: vars.bio }),
        ...(vars.avatarUrl !== undefined && { avatarUrl: vars.avatarUrl }),
        ...(vars.language !== undefined && { language: vars.language }),
        ...(vars.dmLaunchNotify !== undefined && { dmLaunchNotify: vars.dmLaunchNotify }),
      };
      return next;
    },
    onMutate: async (vars): Promise<MutationContext> => {
      if (!user || !profile) return { previous: profile };
      await queryClient.cancelQueries({ queryKey: ['profile', user.id] });
      const previous = profile;
      // Optimistic local update via authStore so all subscribers see immediately.
      setProfile({
        ...profile,
        ...(vars.globalNickname !== undefined && { globalNickname: vars.globalNickname }),
        ...(vars.bio !== undefined && { bio: vars.bio }),
        ...(vars.avatarUrl !== undefined && { avatarUrl: vars.avatarUrl }),
        ...(vars.language !== undefined && { language: vars.language }),
        ...(vars.dmLaunchNotify !== undefined && { dmLaunchNotify: vars.dmLaunchNotify }),
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        setProfile(context.previous);
      }
    },
    onSuccess: (next) => {
      // Keep authStore in sync with server-confirmed shape.
      setProfile(next);
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
    },
  });
}
