import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { PrimaryCTAButton } from '../PrimaryCTAButton';
import { useDmLaunchNotify } from '../../hooks/dm/useDmLaunchNotify';

// DMPL-01 / D-27. Centered placeholder for the DM tab until v1.1.
//
// Layout: chatbubbles-outline icon (96px teal) → display heading → muted body
// (max 280px) → CTA. CTA toggles between two states based on
// profile.dmLaunchNotify:
//   - false → PrimaryCTAButton "출시되면 알려주세요" (filled teal)
//   - true  → outline-variant "알림 등록 완료" with check icon (re-tap shows
//             the alreadyNotifiedToast Alert from the hook)
export function DmPlaceholder() {
  const { t } = useTranslation();
  const { notify, isPending, isNotified } = useDmLaunchNotify();

  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      style={{ paddingHorizontal: 32 }}
    >
      <Ionicons name="chatbubbles-outline" size={96} color="#00E5C3" />
      <Text
        className="text-display font-semibold text-foreground text-center"
        style={{ marginTop: 24 }}
      >
        {t('dm:comingSoon.heading')}
      </Text>
      <Text
        className="text-body text-muted-foreground text-center"
        style={{ marginTop: 8, maxWidth: 280 }}
      >
        {t('dm:comingSoon.body')}
      </Text>
      <View style={{ marginTop: 32, width: '100%' }}>
        {isNotified ? (
          <Pressable
            onPress={notify}
            accessibilityRole="button"
            accessibilityLabel={t('dm:notifiedState')}
            className="mx-4 h-[52px] flex-row items-center justify-center rounded-[28px] border-2 border-teal"
          >
            <Ionicons name="checkmark" size={20} color="#00E5C3" />
            <Text className="text-heading font-semibold text-teal ml-2">
              {t('dm:notifiedState')}
            </Text>
          </Pressable>
        ) : (
          <PrimaryCTAButton
            label={t('dm:notifyMeCta')}
            onPress={notify}
            disabled={isPending}
            loading={isPending}
          />
        )}
      </View>
    </View>
  );
}
