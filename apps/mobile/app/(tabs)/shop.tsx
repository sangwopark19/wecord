import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

// PHASE 7 PLACEHOLDER — overwritten by Plan 07-02 Task 3 (ShopWebView wiring).
// Exists so that Plan 07-01 Task 3's <Tabs.Screen name="shop" /> resolves cleanly
// when 07-01 is executed in isolation. Do not add hooks/state here — minimal
// render only.
export default function ShopPlaceholderScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <Text className="text-heading font-semibold text-foreground">{t('common:tabs.shop')}</Text>
      <Text className="text-body text-muted-foreground mt-2">Coming soon</Text>
    </SafeAreaView>
  );
}
