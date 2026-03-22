import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';

export function HomeSearchBar() {
  const router = useRouter();
  const { t } = useTranslation('community');

  return (
    <Pressable
      onPress={() => router.push('/(community)/search' as never)}
      accessibilityRole="search"
      accessibilityLabel="커뮤니티 검색"
      className="mx-4 h-11 bg-input rounded-xl flex-row items-center px-4"
      style={{ minHeight: 44 }}
    >
      <Ionicons name="search-outline" size={20} color="#666666" />
      <Text className="text-body text-subtle ml-2">{t('search.placeholder')}</Text>
    </Pressable>
  );
}
