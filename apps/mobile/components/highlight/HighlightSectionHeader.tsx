import { View, Text, Pressable } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

interface HighlightSectionHeaderProps {
  title: string;
  onSeeMore?: () => void;
}

export function HighlightSectionHeader({ title, onSeeMore }: HighlightSectionHeaderProps) {
  const { t } = useTranslation('highlight');

  return (
    <View
      className="flex-row items-center justify-between px-4"
      style={{ height: 44 }}
    >
      <Text className="text-heading font-semibold text-foreground">{title}</Text>
      {onSeeMore && (
        <Pressable
          onPress={onSeeMore}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: '#00E5C3' }} className="text-label">
            {t('seeMore')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
