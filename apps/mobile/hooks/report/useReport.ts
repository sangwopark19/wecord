import { useMutation } from '@tanstack/react-query';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '@wecord/shared/i18n';

export type ReportReason = 'hate' | 'spam' | 'violence' | 'copyright' | 'other';

export interface ReportParams {
  targetType: 'post' | 'comment';
  targetId: string;
  reason: ReportReason;
  reasonText?: string; // required when reason === 'other'
}

/**
 * Exported for unit testing — the raw mutation function.
 */
export async function reportMutationFn(params: ReportParams): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Not authenticated');

  const insertPayload: Record<string, string> = {
    reporter_id: user.id,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
  };

  if (params.reasonText) {
    insertPayload.reason_text = params.reasonText;
  }

  const { error } = await supabase.from('reports').insert(insertPayload);

  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE_REPORT');
    }
    throw new Error(error.message);
  }
}

export function useReport() {
  const { t } = useTranslation('report');

  return useMutation({
    mutationFn: reportMutationFn,
    onSuccess: () => {
      if (Platform.OS === 'web') {
        window.alert(t('submitted'));
      } else {
        Alert.alert(t('submitted'));
      }
    },
    onError: (error: Error) => {
      const message =
        error.message === 'DUPLICATE_REPORT' ? t('duplicate') : t('error');

      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert(message);
      }
    },
  });
}
