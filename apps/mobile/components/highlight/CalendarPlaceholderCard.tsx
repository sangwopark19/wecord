import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';

export function CalendarPlaceholderCard() {
  const { t } = useTranslation('highlight');

  return (
    <View className="bg-card rounded-xl p-4 mx-4 items-center justify-center" style={{ height: 100 }}>
      <Ionicons name="calendar-outline" size={32} color="#666666" />
      <Text className="text-body text-muted-foreground text-center mt-2">
        {t('calendarComingSoon')}
      </Text>
    </View>
  );
}
