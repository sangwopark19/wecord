import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@wecord/shared/i18n';
import { useFollowerList, type FollowMember } from '../../../../../hooks/community/useFollowerList';
import { useCommunityMember } from '../../../../../hooks/community/useCommunityMember';
import { FollowButton } from '../../../../../components/community/FollowButton';

export default function FollowerListScreen() {
  const { id, memberId } = useLocalSearchParams<{ id: string; memberId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('community');

  const { data: followers, isLoading } = useFollowerList(memberId ?? '');
  const { data: myMembership } = useCommunityMember(id ?? '');
  const myCmId = myMembership?.id ?? '';

  const renderItem = ({ item }: { item: FollowMember }) => (
    <View className="flex-row items-center px-4 py-2" style={{ minHeight: 60 }}>
      <Pressable
        onPress={() => router.push(`/(community)/${id}/profile/${item.id}` as never)}
        accessibilityRole="link"
      >
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-input items-center justify-center">
            <Ionicons name="person-outline" size={20} color="#666666" />
          </View>
        )}
      </Pressable>

      <Pressable
        className="flex-1 ml-4"
        onPress={() => router.push(`/(community)/${id}/profile/${item.id}` as never)}
        accessibilityRole="link"
      >
        <Text className="text-body font-semibold text-foreground">{item.community_nickname}</Text>
      </Pressable>

      {myCmId && myCmId !== item.id && (
        <FollowButton
          followerCmId={myCmId}
          followingCmId={item.id}
          nickname={item.community_nickname}
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-heading font-semibold text-foreground ml-2">
          {t('profile.tab.followers')}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#00E5C3" />
        </View>
      ) : (followers?.length ?? 0) === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body text-muted-foreground text-center">
            {t('profile.followers.empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}
