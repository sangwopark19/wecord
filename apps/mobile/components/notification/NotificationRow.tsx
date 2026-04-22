import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { Avatar, getSeedFromString } from '../common/CoverGrad';
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

type NotificationType = Notification['type'];

function getBadgeConfig(type: NotificationType): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
} | null {
  switch (type) {
    case 'live':
      return { icon: 'radio-outline', color: '#E11D48' };
    case 'like':
      return { icon: 'heart', color: '#F472B6' };
    case 'comment':
      return { icon: 'chatbubble', color: '#8B5CF6' };
    case 'creator_post':
      return { icon: 'star', color: '#8B5CF6' };
    case 'notice':
      return { icon: 'megaphone', color: '#F59E0B' };
    case 'member_post':
      return { icon: 'person', color: '#22D3EE' };
    default:
      return null;
  }
}

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { t } = useTranslation('notification');
  const isUnread = !notification.is_read;
  const isLive = notification.type === 'live';
  const badge = getBadgeConfig(notification.type);
  const avatarSeed = getSeedFromString(
    (notification.data?.community_id as string | undefined) ??
      (notification.data?.nickname as string | undefined) ??
      notification.id
  );
  const avatarName =
    (notification.data?.nickname as string | undefined) ??
    notification.title.slice(0, 2) ??
    'N';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: isLive && isUnread ? 'rgba(225,29,72,0.08)' : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Left: avatar with badge overlay */}
      <View style={{ marginRight: 12, position: 'relative' }}>
        <Avatar name={avatarName} seed={avatarSeed} size={44} />
        {badge && (
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: badge.color,
              borderWidth: 2,
              borderColor: '#0B0B0F',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={badge.icon} size={10} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Center: title + body */}
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: isUnread ? '#FFFFFF' : 'rgba(235,235,245,0.62)',
            fontFamily: 'Pretendard-SemiBold',
            fontSize: 13,
          }}
        >
          {notification.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: 'rgba(235,235,245,0.62)',
            fontFamily: 'Pretendard-Regular',
            fontSize: 12,
          }}
        >
          {t(`types.${notification.type}`, {
            defaultValue: notification.body,
            nickname: notification.data?.nickname,
            memberName: notification.data?.memberName,
          })}
        </Text>
      </View>

      {/* Right: time */}
      <Text
        style={{
          color: 'rgba(235,235,245,0.38)',
          fontFamily: 'Pretendard-Regular',
          fontSize: 11,
          marginLeft: 8,
        }}
      >
        {getRelativeTime(notification.created_at)}
      </Text>
    </Pressable>
  );
}
