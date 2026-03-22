import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@wecord/shared/i18n';
import { usePostSearch } from '../../../hooks/search/usePostSearch';
import { PostCard } from '../../../components/post/PostCard';
import { PostWithNickname } from '../../../hooks/post/useFanFeed';

export default function PostSearchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('community');
  const { query, setQuery, debouncedQuery, data: results, isLoading, isError, refetch } = usePostSearch(id ?? '');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header with back button and search input */}
      <View className="flex-row items-center px-4 py-2 gap-2">
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <TextInput
          className="flex-1 h-11 bg-input rounded-xl px-4 text-body text-foreground"
          placeholder={t('postSearch.placeholder')}
          placeholderTextColor="#666666"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Results */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#00E5C3" />
        </View>
      )}

      {isError && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body text-muted-foreground text-center mb-4">
            {t('postSearch.error')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
          >
            <Text className="text-teal text-body font-semibold">{t('postSearch.error.retry')}</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && debouncedQuery.trim() && (results?.length ?? 0) === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="search-outline" size={48} color="#999999" />
          <Text className="text-heading font-semibold text-foreground mt-4 text-center">
            {t('postSearch.empty.heading')}
          </Text>
          <Text className="text-body text-muted-foreground mt-2 text-center">
            {t('postSearch.empty.body')}
          </Text>
        </View>
      )}

      {!isLoading && !isError && (results?.length ?? 0) > 0 && (
        <FlashList
          data={results as PostWithNickname[]}
          keyExtractor={(item) => (item as PostWithNickname).id}
          renderItem={({ item }) => (
            <View className="px-4">
              <PostCard
                post={item as PostWithNickname}
                communityId={id}
                highlightQuery={debouncedQuery}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}
