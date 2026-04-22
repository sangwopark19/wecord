import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';

interface Props {
  canGoBack: boolean;
  onBack: () => void;
  onRefresh: () => void;
}

// Phase 7 / SHOP-02: WebView header (48dp + safe-area in parent).
// Left: back chevron with disabled state when WebView history is empty.
// Center: 'Shop' title.
// Right: refresh.
export function ShopHeader({ canGoBack, onBack, onRefresh }: Props) {
  const { t } = useTranslation();
  return (
    <View
      className="border-b border-border bg-card"
      style={{
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
      }}
    >
      <Pressable
        onPress={canGoBack ? onBack : undefined}
        accessibilityRole="button"
        accessibilityLabel={t('shop:aria.back')}
        accessibilityState={{ disabled: !canGoBack }}
        style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
      >
        <Ionicons name="arrow-back" size={24} color={canGoBack ? '#FFFFFF' : '#666666'} />
      </Pressable>
      <Text className="flex-1 text-center text-heading font-semibold text-foreground">
        {t('shop:headerTitle')}
      </Text>
      <Pressable
        onPress={onRefresh}
        accessibilityRole="button"
        accessibilityLabel={t('shop:aria.refresh')}
        style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' }}
      >
        <Ionicons name="refresh" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
