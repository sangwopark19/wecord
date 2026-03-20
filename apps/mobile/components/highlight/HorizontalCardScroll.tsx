import { FlatList } from 'react-native';
import { ReactElement } from 'react';

interface HorizontalCardScrollProps<T> {
  data: T[];
  renderItem: (item: T) => ReactElement;
  keyExtractor: (item: T) => string;
}

export function HorizontalCardScroll<T>({
  data,
  renderItem,
  keyExtractor,
}: HorizontalCardScrollProps<T>) {
  return (
    <FlatList
      data={data}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    />
  );
}
