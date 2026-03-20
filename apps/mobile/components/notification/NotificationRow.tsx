import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import type { Notification } from '../../hooks/notification/useNotifications';

function getRelativeTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${diffDay}일 전`;
}

function getTypeIcon(type: Notification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'comment':
      return 'chatbox-outline';
    case 'like':
      return 'heart-outline';
    case 'notice':
      return 'megaphone-outline';
    case 'creator_post':
      return 'document-text-outline';
    case 'member_post':
      return 'person-outline';
    default:
      return 'notifications-outline';
  }
}

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { t } = useTranslation('notification');
  const isUnread = !notification.is_read;
  const iconColor = isUnread ? '#00E5C3' : '#999999';
  const textColor = isUnread ? undefined : undefined; // handled via className

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isUnread ? 'transparent' : 'transparent',
      }}
      className={isUnread ? 'bg-card' : 'bg-background'}
    >
      {/* Left: type icon */}
      <View style={{ marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={getTypeIcon(notification.type)} size={24} color={iconColor} />
      </View>

      {/* Center: body and time */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          className={`text-body font-regular ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}
          numberOfLines={2}
        >
          {t(`types.${notification.type}`, {
            defaultValue: notification.body,
            nickname: notification.data?.nickname,
            memberName: notification.data?.memberName,
          })}
        </Text>
        <Text className="text-label text-muted-foreground">
          {getRelativeTime(notification.created_at)}
        </Text>
      </View>

      {/* Right: unread dot */}
      {isUnread && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00E5C3',
            marginLeft: 8,
          }}
        />
      )}
    </Pressable>
  );
}
