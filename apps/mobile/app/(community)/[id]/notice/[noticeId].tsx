import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNoticeDetail } from '../../../../hooks/notice/useNoticeDetail';
import { useTranslation } from '@wecord/shared/i18n';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default function NoticeDetailScreen() {
  const { noticeId } = useLocalSearchParams<{ noticeId: string }>();
  const router = useRouter();
  const { t } = useTranslation('notice');
  const { data: notice, isLoading, isError, refetch } = useNoticeDetail(noticeId ?? '');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00E5C3" />
      </SafeAreaView>
    );
  }

  if (isError || !notice) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
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
      <View className="px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {/* Title */}
        <Text
          className="text-display font-semibold text-foreground"
          style={{ fontSize: 20 }}
        >
          {notice.title}
        </Text>

        {/* Date */}
        <Text className="text-label text-muted-foreground" style={{ marginTop: 8 }}>
          {formatDate(notice.published_at)}
        </Text>

        {/* Body */}
        <Text
          className="text-body font-regular text-foreground"
          style={{ marginTop: 16, lineHeight: 21 }}
        >
          {notice.content}
        </Text>

        {/* Images */}
        {notice.media_urls && notice.media_urls.length > 0 && (
          <View style={{ marginTop: 16, gap: 12 }}>
            {notice.media_urls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
                contentFit="cover"
                transition={200}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
