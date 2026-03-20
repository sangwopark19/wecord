import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useUnreadNotificationCount } from '../../hooks/notification/useUnreadNotificationCount';

interface NotificationBellBadgeProps {
  communityId: string;
  onPress: () => void;
}

export function NotificationBellBadge({ communityId, onPress }: NotificationBellBadgeProps) {
  const { user } = useAuthStore();
  const count = useUnreadNotificationCount(user?.id ?? '', communityId);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="알림"
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ position: 'relative' }}>
        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        {count > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#FF3B30',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: '600',
                lineHeight: 12,
              }}
            >
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
