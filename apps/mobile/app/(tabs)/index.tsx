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
import { HomeSearchBar } from '../../components/home/HomeSearchBar';
import { OnLiveRail } from '../../components/home/OnLiveRail';
import { ArtistDMRail } from '../../components/home/ArtistDMRail';
import { MyCommunitiesRail } from '../../components/home/MyCommunitiesRail';
import { DiscoverGrid } from '../../components/home/DiscoverGrid';
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
        backgroundColor: 'rgba(0,0,0,0.35)',
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
        backgroundColor: 'rgba(0,0,0,0.35)',
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

function HomeHeader({ overBanner }: { overBanner: boolean }) {
  return (
    <View
      style={{
        position: overBanner ? 'absolute' : 'relative',
        top: overBanner ? 0 : undefined,
        left: 0,
        right: 0,
        zIndex: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: overBanner ? 10 : 12,
      }}
    >
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <HomeIconButton name="search-outline" label="검색" />
        <HomeIconButton name="mail-outline" label="DM" />
        <HomeNotificationBell />
      </View>
    </View>
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
  const hasBanner = banners.length > 0;

  if (isNewUser) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <HomeHeader overBanner={false} />
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
          <View style={{ marginTop: 8 }}>
            <HomeSearchBar />
          </View>
          {hasBanner && (
            <View style={{ marginTop: 12 }}>
              <PromotionBannerCarousel banners={banners} />
            </View>
          )}
          <OnLiveRail />
          <DiscoverGrid />
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={hasBanner ? [] : ['top']}>
      {isError && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: '#15151B',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: 'rgba(235,235,245,0.62)', flex: 1 }}>{t('error')}</Text>
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
            style={{ marginLeft: 8 }}
          >
            <Text style={{ color: '#8B5CF6', fontFamily: 'Pretendard-SemiBold' }}>다시 시도</Text>
          </Pressable>
        </View>
      )}
      <FlashList
        data={posts as PostWithNickname[]}
        keyExtractor={(item) => (item as PostWithNickname).id}
        ListHeaderComponent={
          <View>
            {hasBanner ? (
              <View style={{ position: 'relative' }}>
                <HomeHeader overBanner={true} />
                <PromotionBannerCarousel banners={banners} />
              </View>
            ) : (
              <HomeHeader overBanner={false} />
            )}
            <OnLiveRail />
            <ArtistDMRail />
            <MyCommunitiesRail />
            <DiscoverGrid />
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 28,
                paddingBottom: 8,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'Pretendard-Bold',
                  fontSize: 18,
                  letterSpacing: -0.3,
                }}
              >
                {t('feed.heading', { defaultValue: 'Latest from your communities' })}
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(235,235,245,0.38)' }}>…</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
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
    </SafeAreaView>
  );
}
