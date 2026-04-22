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

function HomeIconButton({
  name,
  onPress,
  label,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={18} color="#FFFFFF" />
    </Pressable>
  );
}

function HomeNotificationBell() {
  const router = useRouter();
  const { user } = useAuthStore();
  const count = useAllUnreadNotificationCount(user?.id ?? '');

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/notifications' as never)}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `알림, ${count}개 읽지 않음` : '알림'}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ position: 'relative' }}>
        <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
        {count > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 4,
              borderRadius: 8,
              backgroundColor: '#E11D48',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 9,
                fontFamily: 'Pretendard-Bold',
                lineHeight: 11,
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
      {/* Header — wecord wordmark + icon row (Variation A) */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-3">
        <Text
          style={{
            fontFamily: 'Pretendard-ExtraBold',
            fontSize: 22,
            letterSpacing: -0.5,
            color: '#FFFFFF',
          }}
        >
          wecord
        </Text>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <HomeIconButton name="search-outline" label="검색" />
          <HomeIconButton name="mail-outline" label="DM" />
          <HomeNotificationBell />
        </View>
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
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
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
                <Text className="text-accent text-body font-semibold">다시 시도</Text>
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
                tintColor="#8B5CF6"
                colors={['#8B5CF6']}
              />
            }
            contentContainerStyle={{ paddingBottom: 64 }}
          />
        </>
      )}
    </SafeAreaView>
  );
}
