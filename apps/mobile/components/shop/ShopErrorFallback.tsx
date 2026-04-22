import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { PrimaryCTAButton } from '../PrimaryCTAButton';

// Phase 7 / D-25: WebView error fallback. Centered icon + heading + body + retry.
// Shown when WebView.onError fires OR onHttpError reports HTTP 5xx.
export function ShopErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center px-8 bg-background">
      <Ionicons name="alert-circle-outline" size={48} color="#999999" />
      <Text className="text-heading font-semibold text-foreground text-center mt-4">
        {t('shop:error.heading')}
      </Text>
      <Text className="text-body text-muted-foreground text-center mt-2">
        {t('shop:error.body')}
      </Text>
      <View className="mt-6 w-full">
        <PrimaryCTAButton label={t('shop:error.retryCta')} onPress={onRetry} />
      </View>
    </View>
  );
}
