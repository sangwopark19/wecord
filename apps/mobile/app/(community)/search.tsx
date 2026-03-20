import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useCommunitySearch } from '../../hooks/community/useCommunitySearch';
import { CommunityCard } from '../../components/community/CommunityCard';
import type { CommunitySearchResult } from '../../hooks/community/useCommunitySearch';

// Simple debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useCallback(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function CommunitySearchScreen() {
  const { t } = useTranslation('community');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Manual debounce: update debouncedQuery 300ms after query changes
  const handleQueryChange = (text: string) => {
    setQuery(text);
    // We use a simple approach here rather than a complex hook
    const timer = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
    return () => clearTimeout(timer);
  };

  const { data: communities, isLoading } = useCommunitySearch(debouncedQuery);

  const renderItem = ({ item }: { item: CommunitySearchResult }) => (
    <View className="flex-1">
      <CommunityCard community={item} />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    if (!debouncedQuery.trim()) return null;

    return (
      <View className="flex-1 items-center justify-center py-16">
        <Ionicons name="search-outline" size={48} color="#666666" />
        <Text className="text-heading font-semibold text-foreground mt-4">
          {t('search.empty.heading')}
        </Text>
        <Text className="text-body text-muted-foreground mt-2">{t('search.empty.body')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Search bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-input rounded-xl px-3 h-[44px]">
          <Ionicons name="search-outline" size={20} color="#666666" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#666666"
            className="flex-1 ml-2 text-body text-foreground"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {isLoading ? <ActivityIndicator size="small" color="#666666" /> : null}
        </View>
      </View>

      {/* Results grid */}
      <FlatList
        data={communities ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
