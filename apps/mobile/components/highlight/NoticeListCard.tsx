import { View, Text, Pressable } from 'react-native';
import { HighlightNotice } from '../../hooks/highlight/useHighlight';

interface NoticeListCardProps {
  notice: HighlightNotice;
  onPress: () => void;
}

export function NoticeListCard({ notice, onPress }: NoticeListCardProps) {
  const publishedDate = notice.published_at
    ? new Date(notice.published_at).toLocaleDateString('ko-KR')
    : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notice.title}
      className="bg-card rounded-xl p-3"
      style={{ width: 120 }}
    >
      {/* Pinned indicator row */}
      {notice.is_pinned && (
        <View className="flex-row items-center mb-1">
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginRight: 4 }}
          />
        </View>
      )}

      {/* Title */}
      <Text className="text-body font-semibold text-foreground" numberOfLines={2}>
        {notice.title}
      </Text>

      {/* Date */}
      <Text className="text-label text-muted-foreground mt-1">
        {publishedDate}
      </Text>
    </Pressable>
  );
}
