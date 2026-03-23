import { View, Text, Pressable, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '../../hooks/notification/useNotifications';

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

function useGlobalNotifications() {
  const { user } = useAuthStore();

  return useQuery<Notification[]>({
    queryKey: ['notifications', user?.id, 'global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, data, is_read, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!user,
  });
}

function useMarkAllReadGlobal() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id, 'global'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', user?.id, 'global']);

      queryClient.setQueryData<Notification[]>(['notifications', user?.id, 'global'], (old) =>
        (old ?? []).map((n) => ({ ...n, is_read: true }))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', user?.id, 'global'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, 'global'] });
    },
  });
}

function useMarkNotificationReadGlobal() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id, 'global'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', user?.id, 'global']);

      queryClient.setQueryData<Notification[]>(['notifications', user?.id, 'global'], (old) =>
        (old ?? []).map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', user?.id, 'global'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, 'global'] });
    },
  });
}

import { NotificationRow } from '../../components/notification/NotificationRow';
import { NotificationGroupHeader } from '../../components/notification/NotificationGroupHeader';

export default function GlobalNotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation('notification');

  const { data: notifications, isLoading, isError } = useGlobalNotifications();
  const markRead = useMarkNotificationReadGlobal();
  const markAllRead = useMarkAllReadGlobal();

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }

    // Navigate to deep link
    if (notification.data?.community_id && notification.data?.post_id) {
      router.push(`/(community)/${notification.data.community_id}/post/${notification.data.post_id}` as never);
    } else if (notification.data?.community_id && notification.data?.notice_id) {
      router.push(`/(community)/${notification.data.community_id}/notices` as never);
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
          accessibilityLabel="Back"
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
            {t('markAllRead')}
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
            {t('error.load')}
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
