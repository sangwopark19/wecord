import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import type { JoinedCommunity } from '../../hooks/community/useMyCommunities';

interface Props {
  community: JoinedCommunity;
  isLast?: boolean;
}

export function JoinedCommunityRow({ community, isLast }: Props) {
  const router = useRouter();
  const { t } = useTranslation('more');
  const initial = (community.communityName?.[0] ?? '?').toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={community.communityName}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPress={() => router.push(`/(community)/${community.communityId}` as any)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#2A2A2A',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: '#00E5C3',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {community.coverImageUrl ? (
          <Image source={{ uri: community.coverImageUrl }} style={{ width: 40, height: 40 }} />
        ) : (
          <Text className="text-body font-semibold text-foreground">{initial}</Text>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text className="text-body font-semibold text-foreground" numberOfLines={1}>
          {community.communityName}
        </Text>
        <Text className="text-label text-muted-foreground" numberOfLines={1}>
          {t('joinedCommunities.myNicknameLabel', { nickname: community.myCommunityNickname })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#999999" />
    </Pressable>
  );
}
