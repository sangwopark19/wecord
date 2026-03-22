import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@wecord/shared/i18n';
import { useCommunityProfile, useMemberPosts, useMemberPostCount } from '../../../../hooks/community/useCommunityProfile';
import { useCommunityMember } from '../../../../hooks/community/useCommunityMember';
import { useAuthStore } from '../../../../stores/authStore';
import { FollowButton } from '../../../../components/community/FollowButton';
import { PostCard } from '../../../../components/post/PostCard';
import { PostWithNickname } from '../../../../hooks/post/useFanFeed';

type TabKey = 'posts' | 'comments';

function SkeletonProfile() {
  return (
    <View className="items-center px-4 py-6">
      <View className="w-20 h-20 rounded-full bg-input mb-2" />
      <View className="w-32 h-5 bg-input rounded mb-4" />
      <View className="flex-row gap-6">
        <View className="w-16 h-8 bg-input rounded" />
        <View className="w-16 h-8 bg-input rounded" />
        <View className="w-16 h-8 bg-input rounded" />
      </View>
    </View>
  );
}

export default function CommunityProfileScreen() {
  const { id, memberId } = useLocalSearchParams<{ id: string; memberId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('community');
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

  const { data: profile, isLoading: profileLoading } = useCommunityProfile(memberId ?? '');
  const { data: memberPosts, isLoading: postsLoading } = useMemberPosts(memberId ?? '', id ?? '');
  const { data: postCount } = useMemberPostCount(memberId ?? '', id ?? '');
  const { data: myMembership } = useCommunityMember(id ?? '');

  const isOwn = !!user && profile?.user_id === user.id;
  const myCmId = myMembership?.id ?? '';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </Pressable>

      {profileLoading ? (
        <SkeletonProfile />
      ) : (
        <View className="items-center px-4 pb-4">
          {/* Avatar */}
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-input items-center justify-center">
              <Ionicons name="person-outline" size={32} color="#666666" />
            </View>
          )}

          {/* Nickname */}
          <Text className="text-display font-semibold text-foreground mt-2">
            {profile?.community_nickname ?? ''}
          </Text>

          {/* Stats row */}
          <View className="flex-row mt-4 gap-6">
            {/* Posts */}
            <View className="items-center">
              <Text className="text-heading font-semibold text-foreground">{postCount ?? 0}</Text>
              <Text className="text-label text-muted-foreground">{t('profile.stat.posts')}</Text>
            </View>

            {/* Followers */}
            <Pressable
              className="items-center"
              onPress={() => router.push(`/(community)/${id}/profile/${memberId}/followers` as never)}
            >
              <Text className="text-heading font-semibold text-foreground">{profile?.follower_count ?? 0}</Text>
              <Text className="text-label text-muted-foreground">{t('profile.stat.followers')}</Text>
            </Pressable>

            {/* Following */}
            <Pressable
              className="items-center"
              onPress={() => router.push(`/(community)/${id}/profile/${memberId}/following` as never)}
            >
              <Text className="text-heading font-semibold text-foreground">{profile?.following_count ?? 0}</Text>
              <Text className="text-label text-muted-foreground">{t('profile.stat.following')}</Text>
            </Pressable>
          </View>

          {/* Follow button */}
          {!isOwn && myCmId && (
            <View className="mt-4">
              <FollowButton
                followerCmId={myCmId}
                followingCmId={memberId ?? ''}
                isOwnProfile={isOwn}
                nickname={profile?.community_nickname}
              />
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row border-b border-border">
        <Pressable
          className="flex-1 py-3 items-center"
          onPress={() => setActiveTab('posts')}
        >
          <Text className={activeTab === 'posts' ? 'text-body font-semibold text-teal' : 'text-body text-muted-foreground'}>
            {t('profile.tab.posts')}
          </Text>
          {activeTab === 'posts' && (
            <View className="absolute bottom-0 left-4 right-4 h-0.5 bg-teal" />
          )}
        </Pressable>

        <Pressable
          className="flex-1 py-3 items-center"
          onPress={() => setActiveTab('comments')}
        >
          <Text className={activeTab === 'comments' ? 'text-body font-semibold text-teal' : 'text-body text-muted-foreground'}>
            {t('profile.tab.comments')}
          </Text>
          {activeTab === 'comments' && (
            <View className="absolute bottom-0 left-4 right-4 h-0.5 bg-teal" />
          )}
        </Pressable>
      </View>

      {/* Tab content */}
      {activeTab === 'posts' && (
        <>
          {postsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#00E5C3" />
            </View>
          ) : (
            <FlashList
              data={(memberPosts ?? []) as PostWithNickname[]}
              keyExtractor={(item) => (item as PostWithNickname).id}
              renderItem={({ item }) => (
                <View className="px-4">
                  <PostCard
                    post={item as PostWithNickname}
                    communityId={id}
                  />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          )}
        </>
      )}

      {activeTab === 'comments' && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body text-muted-foreground">{t('profile.tab.comments')}</Text>
        </View>
      )}
    </View>
  );
}
