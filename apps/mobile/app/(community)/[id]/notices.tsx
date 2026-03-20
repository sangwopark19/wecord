import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotices, Notice } from '../../../hooks/notice/useNotices';
import { NoticeRow } from '../../../components/notice/NoticeRow';
import { useTranslation } from '@wecord/shared/i18n';

export default function NoticesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('notice');
  const { data: notices, isLoading, isError, refetch } = useNotices(id ?? '');

  const handleNoticePress = (notice: Notice) => {
    router.push(`/(community)/${id}/notice/${notice.id}` as never);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00E5C3" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            className="w-10 h-10 items-center justify-center mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-heading font-semibold text-foreground" style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body text-muted-foreground text-center">{t('error.load')}</Text>
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            style={{ marginTop: 16, minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ color: '#00E5C3' }} className="text-body">
              {t('retry')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          className="w-10 h-10 items-center justify-center mr-2"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-heading font-semibold text-foreground" style={{ fontSize: 20 }}>
          {t('title')}
        </Text>
      </View>

      <FlatList
        data={notices ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoticeRow notice={item} onPress={() => handleNoticePress(item)} />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8" style={{ paddingTop: 80 }}>
            <Ionicons name="megaphone-outline" size={48} color="#666666" />
            <Text className="text-heading font-semibold text-foreground mt-4 text-center">
              {t('empty.heading')}
            </Text>
            <Text className="text-body text-muted-foreground mt-2 text-center">
              {t('empty.body')}
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
