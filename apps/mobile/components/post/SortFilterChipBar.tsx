import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

type SortOption = 'latest' | 'popular';
type FilterOption = 'all' | 'following' | 'hot';

interface SortFilterChipBarProps {
  sort: SortOption;
  filter: FilterOption;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full mr-2 ${active ? 'bg-teal' : 'bg-card'}`}
      style={{ minHeight: 32, justifyContent: 'center' }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`${active ? 'text-[#000000] font-semibold' : 'text-muted-foreground font-regular'} text-body`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SortFilterChipBar({
  sort,
  filter,
  onSortChange,
  onFilterChange,
}: SortFilterChipBarProps) {
  const { t } = useTranslation('community');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}
      className="bg-background"
    >
      <Chip
        label={t('feed.sort.latest')}
        active={sort === 'latest'}
        onPress={() => onSortChange('latest')}
      />
      <Chip
        label={t('feed.sort.popular')}
        active={sort === 'popular'}
        onPress={() => onSortChange('popular')}
      />

      {/* Separator */}
      <View className="bg-input w-px mx-2" style={{ height: 16 }} />

      <Chip
        label={t('feed.filter.all')}
        active={filter === 'all'}
        onPress={() => onFilterChange('all')}
      />
      <Chip
        label={t('feed.filter.following')}
        active={filter === 'following'}
        onPress={() => onFilterChange('following')}
      />
      <Chip
        label={t('feed.filter.hot')}
        active={filter === 'hot'}
        onPress={() => onFilterChange('hot')}
      />
    </ScrollView>
  );
}
