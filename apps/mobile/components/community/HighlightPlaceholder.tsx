import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';

export function HighlightPlaceholder() {
  const { t } = useTranslation('community');

  return (
    <View className="flex-1 items-center justify-center py-16">
      <Ionicons name="sparkles-outline" size={48} color="#666666" />
      <Text className="text-heading font-semibold text-foreground mt-4">
        {t('tabs.highlight')}
      </Text>
      <Text className="text-body text-muted-foreground mt-2 text-center px-8">
        {t('highlight.placeholder')}
      </Text>
    </View>
  );
}
