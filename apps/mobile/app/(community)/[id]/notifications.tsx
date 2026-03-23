import { View, Text, Pressable, SectionList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../../stores/authStore';
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
  const { user } = useAuthStore();

  const communityId = id ?? '';
  const { data: notifications, isLoading, isError } = useNotifications(communityId);
  const markRead = useMarkNotificationRead(user?.id ?? '', communityId);
  const markAllRead = useMarkAllRead(user?.id ?? '', communityId);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }

    if (notification.data?.post_id) {
      router.push(`/(community)/${communityId}/post/${notification.data.post_id}` as never);
    } else if (notification.data?.notice_id) {
      router.push(`/(community)/${communityId}/notices` as never);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => Alert.alert('', t('markAllReadSuccess', { defaultValue: '모든 알림을 읽음 처리했습니다' })),
    });
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

        <Text className="text-display font-semibold text-foreground" style={{ flex: 1 }}>
          {t('title')}
        </Text>

        <Pressable
          onPress={() => router.push(`/(community)/${communityId}/notification-preferences` as never)}
          accessibilityRole="button"
          accessibilityLabel="알림 설정"
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={handleMarkAllRead}
          disabled={markAllRead.isPending}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 8, opacity: markAllRead.isPending ? 0.5 : 1 }}
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
