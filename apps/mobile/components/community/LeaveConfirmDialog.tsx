import { Alert } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

interface LeaveConfirmDialogOptions {
  onConfirm: () => void;
}

export function showLeaveConfirmDialog({ onConfirm }: LeaveConfirmDialogOptions) {
  // This is a function, not a component, since Alert.alert is imperative
  return {
    show: (t: ReturnType<typeof useTranslation>['t']) => {
      Alert.alert(
        t('community:leave.confirm.title'),
        t('community:leave.confirm.message'),
        [
          {
            text: t('common:cta.confirm'),
            style: 'cancel',
          },
          {
            text: t('community:leave.confirm.action'),
            style: 'destructive',
            onPress: onConfirm,
          },
        ]
      );
    },
  };
}

export function useLeaveConfirmDialog() {
  const { t } = useTranslation('community');

  const show = (onConfirm: () => void) => {
    Alert.alert(
      t('leave.confirm.title'),
      t('leave.confirm.message'),
      [
        {
          text: t('common:cta.confirm', { ns: 'common' }),
          style: 'cancel',
        },
        {
          text: t('leave.confirm.action'),
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  };

  return { show };
}
