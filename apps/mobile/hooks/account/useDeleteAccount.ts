import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import {
  buildDeleteUserRequest,
  gateDeleteCall,
  shouldSignOutAfter,
} from './deleteAccountHelpers';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

// Phase 7 / D-37 / T-7-02 — orchestrates the in-app account deletion flow.
//
// Order:
//   1. Read current session.
//   2. Gate: throw 'no_session' if missing access_token (prevents blind delete).
//   3. POST to /functions/v1/delete-user with Authorization: Bearer <token>.
//   4. Only on 2xx → call authStore.signOut() (which already clears
//      queryClient via the registered onSignOut callback — Plan 07-01 T-7-05).
//   5. On non-2xx → throw with status + body so the UI can surface a toast.
//
// 401 path explicitly does NOT signOut: the user keeps their session locally
// so they can retry without losing context (Pitfall 5 ordering).
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const gate = gateDeleteCall(session);
      if (!gate.ok) throw new Error(gate.reason ?? 'no_session');

      const { url, init } = buildDeleteUserRequest({
        supabaseUrl: SUPABASE_URL,
        accessToken: session!.access_token,
      });
      const res = await fetch(url, init);

      if (!shouldSignOutAfter(res.status)) {
        const body = await res.text();
        throw new Error(`delete_failed: ${res.status} ${body}`);
      }

      // Server-side delete succeeded — now clear local state.
      await useAuthStore.getState().signOut();
    },
  });
}
