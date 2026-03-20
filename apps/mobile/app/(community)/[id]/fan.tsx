import { useState } from 'react';
import { View, Text, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { useFanFeed, PostWithNickname } from '../../../hooks/post/useFanFeed';
import { PostCard } from '../../../components/post/PostCard';
import { SortFilterChipBar } from '../../../components/post/SortFilterChipBar';
import { FAB } from '../../../components/post/FAB';

type SortOption = 'latest' | 'popular';
type FilterOption = 'all' | 'following' | 'hot';

function SkeletonCard() {
  return (
    <View className="bg-card rounded-xl h-24 mb-2 mx-4 animate-pulse" />
  );
}

function EmptyState() {
  const { t } = useTranslation('community');
  return (
    <View className="flex-1 items-center justify-center py-16">
      <Ionicons name="document-text-outline" size={48} color="#999999" />
      <Text className="text-heading font-semibold text-foreground mt-4 text-center">
        {t('feed.fan.empty.heading')}
      </Text>
      <Text className="text-body text-muted-foreground mt-2 text-center">
        {t('feed.fan.empty.body')}
      </Text>
    </View>
  );
}

export default function FanTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('community');
  const [sort, setSort] = useState<SortOption>('latest');
  const [filter, setFilter] = useState<FilterOption>('all');

  const {
    data,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useFanFeed(id ?? '', sort, filter);

  const posts = data?.pages.flatMap((page) => page) ?? [];

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const ListFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    if (!hasNextPage && posts.length > 0) {
      return (
        <View className="py-4 items-center">
          <Text className="text-label text-subtle">— 끝 —</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-background">
      <SortFilterChipBar
        sort={sort}
        filter={filter}
        onSortChange={setSort}
        onFilterChange={setFilter}
      />

      {isError && (
        <View className="mx-4 mb-2 bg-card rounded-xl p-4 flex-row items-center justify-between">
          <Text className="text-body text-muted-foreground flex-1">
            {t('feed.error.load')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
            className="ml-2"
          >
            <Text className="text-teal text-body font-semibold">{t('common.retry')}</Text>
          </Pressable>
        </View>
      )}

      {/* estimatedItemSize=120 — optimization hint (not a prop in FlashList 2.3.0; upgrade to 2.7+ enables it) */}
      <FlashList
        data={posts as PostWithNickname[]}
        getItemType={(item) => ((item as PostWithNickname).media_urls?.length ? 'media' : 'text')}
        renderItem={({ item }) => (
          <View className="px-4">
            <PostCard
              post={item as PostWithNickname}
              clampLines={3}
              communityId={id}
            />
          </View>
        )}
        keyExtractor={(item) => (item as PostWithNickname).id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#00E5C3"
          />
        }
        ListFooterComponent={ListFooter}
        ListEmptyComponent={isError ? null : EmptyState}
        contentContainerStyle={{ paddingBottom: 64 }}
      />

      <FAB />
    </View>
  );
}
