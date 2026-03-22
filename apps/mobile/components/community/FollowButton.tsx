import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';
import { useFollowMember, useIsFollowing } from '../../hooks/community/useFollowMember';

interface FollowButtonProps {
  followerCmId: string;
  followingCmId: string;
  isOwnProfile?: boolean;
  nickname?: string;
}

export function FollowButton({ followerCmId, followingCmId, isOwnProfile, nickname }: FollowButtonProps) {
  const { t } = useTranslation('community');
  const { data: isFollowing, isLoading: isCheckingFollow } = useIsFollowing(followerCmId, followingCmId);
  const followMutation = useFollowMember();

  if (isOwnProfile) return null;

  if (isCheckingFollow || followMutation.isPending) {
    return (
      <View
        className="rounded-full px-6 py-2 items-center justify-center bg-card border border-border"
        style={{ minWidth: 80, minHeight: 36 }}
      >
        <ActivityIndicator color="#00E5C3" size="small" />
      </View>
    );
  }

  const handlePress = () => {
    if (!followerCmId || !followingCmId) return;

    if (isFollowing) {
      // Show unfollow confirmation
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(t('profile.unfollowConfirm.body', { nickname: nickname ?? '' }));
        if (confirmed) {
          followMutation.mutate({ followerCmId, followingCmId, isFollowing: true });
        }
        return;
      }

      Alert.alert(
        t('profile.unfollowConfirm.title'),
        t('profile.unfollowConfirm.body', { nickname: nickname ?? '' }),
        [
          {
            text: t('profile.unfollowConfirm.dismiss'),
            style: 'cancel',
          },
          {
            text: t('profile.unfollowConfirm.confirm'),
            style: 'destructive',
            onPress: () => followMutation.mutate({ followerCmId, followingCmId, isFollowing: true }),
          },
        ]
      );
    } else {
      followMutation.mutate({ followerCmId, followingCmId, isFollowing: false });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={
        isFollowing
          ? 'bg-card border border-border rounded-full px-6 py-2 items-center justify-center'
          : 'bg-teal rounded-full px-6 py-2 items-center justify-center'
      }
      accessibilityRole="button"
      accessibilityState={{ selected: !!isFollowing }}
    >
      <Text
        className={isFollowing ? 'text-body font-semibold text-foreground' : 'text-body font-semibold text-background'}
      >
        {isFollowing ? t('profile.following') : t('profile.follow')}
      </Text>
    </Pressable>
  );
}
