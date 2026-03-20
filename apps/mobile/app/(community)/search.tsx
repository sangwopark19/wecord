import { useState, useEffect } from 'react';
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

export default function CommunitySearchScreen() {
  const { t } = useTranslation('community');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Proper useEffect-based debounce with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: communities, isLoading } = useCommunitySearch(debouncedQuery);

  const renderItem = ({ item }: { item: CommunitySearchResult }) => (
    <View style={{ width: '50%' }}>
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
            onChangeText={setQuery}
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
