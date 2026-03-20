import { View, Text, Pressable, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useNotifications, type Notification } from '../../../hooks/notification/useNotifications';
import {
  useMarkNotificationRead,
  useMarkAllRead,
} from '../../../hooks/notification/useMarkNotificationRead';
import { NotificationRow } from '../../../components/notification/NotificationRow';
import { NotificationGroupHeader } from '../../../components/notification/NotificationGroupHeader';

interface NotificationSection {
  title: string;
  data: Notification[];
}

function groupNotifications(
  notifications: Notification[],
  labels: { today: string; yesterday: string; thisWeek: string }
): NotificationSection[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayItems: Notification[] = [];
  const yesterdayItems: Notification[] = [];
  const thisWeekItems: Notification[] = [];

  for (const n of notifications) {
    const created = new Date(n.created_at);
    if (created >= today) {
      todayItems.push(n);
    } else if (created >= yesterday) {
      yesterdayItems.push(n);
    } else if (created >= weekAgo) {
      thisWeekItems.push(n);
    }
    // Older than a week: excluded from grouped list
  }

  const sections: NotificationSection[] = [];
  if (todayItems.length > 0) sections.push({ title: labels.today, data: todayItems });
  if (yesterdayItems.length > 0) sections.push({ title: labels.yesterday, data: yesterdayItems });
  if (thisWeekItems.length > 0) sections.push({ title: labels.thisWeek, data: thisWeekItems });

  return sections;
}

export default function NotificationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('notification');

  const communityId = id ?? '';
  const { data: notifications, isLoading, isError } = useNotifications(communityId);
  const markRead = useMarkNotificationRead(communityId);
  const markAllRead = useMarkAllRead(communityId);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }

    // Navigate to deep link
    if (notification.data?.post_id) {
      router.push(`/(community)/${communityId}/post/${notification.data.post_id}` as never);
    } else if (notification.data?.notice_id) {
      router.push(`/(community)/${communityId}/notices` as never);
    }
  };

  const sections = groupNotifications(notifications ?? [], {
    today: t('groups.today'),
    yesterday: t('groups.yesterday'),
    thisWeek: t('groups.thisWeek'),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
        }}
        className="border-border"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          style={{ minHeight: 44, justifyContent: 'center', paddingRight: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text className="text-display font-semibold text-foreground">
          {t('title')}
        </Text>

        <Pressable
          onPress={() => markAllRead.mutate()}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 8 }}
        >
          <Text style={{ color: '#00E5C3' }} className="text-body">
            모두 읽음
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body text-muted-foreground text-center">
            알림을 불러오지 못했습니다.
          </Text>
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8" style={{ paddingTop: 64 }}>
          <Ionicons name="notifications-outline" size={48} color="#666666" />
          <Text className="text-heading font-semibold text-foreground mt-4 text-center">
            {t('empty.heading')}
          </Text>
          <Text className="text-body text-muted-foreground mt-2 text-center">
            {t('empty.body')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <NotificationGroupHeader label={section.title} />
          )}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          stickySectionHeadersEnabled
        />
      )}
    </SafeAreaView>
  );
}
