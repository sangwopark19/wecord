import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '../../stores/authStore';
import { useHomeFeed } from '../../hooks/home/useHomeFeed';
import { usePromotionBanners } from '../../hooks/home/usePromotionBanners';
import { useAllUnreadNotificationCount } from '../../hooks/notification/useAllUnreadNotificationCount';
import { PromotionBannerCarousel } from '../../components/home/PromotionBannerCarousel';
import { RecommendationSection } from '../../components/home/RecommendationSection';
import { HomeSearchBar } from '../../components/home/HomeSearchBar';
import { PostCard } from '../../components/post/PostCard';
import { useTranslation } from '@wecord/shared/i18n';
import type { PostWithNickname } from '../../hooks/post/useFanFeed';

function HomeNotificationBell() {
  const router = useRouter();
  const { user } = useAuthStore();
  const count = useAllUnreadNotificationCount(user?.id ?? '');

  return (
    <Pressable
      onPress={() => router.push('/(community)/notifications' as never)}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `알림, ${count}개 읽지 않음` : '알림'}
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

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const { data: bannerData } = usePromotionBanners();
  const banners = bannerData ?? [];

  const {
    data,
    isNewUser,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useHomeFeed();

  const posts = data?.pages.flat() ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-2">
        <Text className="text-display font-semibold text-foreground">Wecord</Text>
        <HomeNotificationBell />
      </View>

      {/* Body — conditional on community membership */}
      {isNewUser ? (
        // 0-community view: search bar + banner + recommendation grid
        <ScrollView
          contentContainerStyle={{ paddingBottom: 64 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#00E5C3"
              colors={['#00E5C3']}
            />
          }
        >
          <View className="mt-2">
            <HomeSearchBar />
          </View>
          <View className="mt-3">
            <PromotionBannerCarousel banners={banners} />
          </View>
          <RecommendationSection />
        </ScrollView>
      ) : (
        // 1+-community view: unified FlashList feed with banner as header
        <>
          {isError && (
            <View className="mx-4 mb-2 bg-card rounded-xl p-4 flex-row items-center justify-between">
              <Text className="text-body text-muted-foreground flex-1">{t('error')}</Text>
              <Pressable
                onPress={() => refetch()}
                accessibilityRole="button"
                accessibilityLabel="다시 시도"
                className="ml-2"
              >
                <Text className="text-teal text-body font-semibold">다시 시도</Text>
              </Pressable>
            </View>
          )}
          <FlashList
            data={posts as PostWithNickname[]}
            keyExtractor={(item) => (item as PostWithNickname).id}
            ListHeaderComponent={<PromotionBannerCarousel banners={banners} />}
            renderItem={({ item }) => (
              <View className="px-4">
                <PostCard
                  post={item as PostWithNickname}
                  showCommunityChip
                  communityId={(item as PostWithNickname).community_id}
                />
              </View>
            )}
            onEndReached={() => fetchNextPage()}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#00E5C3"
                colors={['#00E5C3']}
              />
            }
            contentContainerStyle={{ paddingBottom: 64 }}
          />
        </>
      )}
    </SafeAreaView>
  );
}
