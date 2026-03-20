import { View, Text, Pressable } from 'react-native';
import { Notice } from '../../hooks/notice/useNotices';

interface NoticeRowProps {
  notice: Notice;
  onPress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function NoticeRow({ notice, onPress }: NoticeRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notice.title}
      style={[
        {
          minHeight: 56,
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        notice.is_pinned
          ? {
              borderLeftWidth: 2,
              borderLeftColor: '#00E5C3',
              backgroundColor: '#1A1A1A', // bg-card equivalent
            }
          : {
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
              backgroundColor: 'transparent',
            },
      ]}
    >
      {/* Title row — pinned shows teal dot */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {notice.is_pinned && (
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E5C3', flexShrink: 0 }}
          />
        )}
        <Text
          className="text-heading font-semibold text-foreground"
          numberOfLines={2}
          style={{ flex: 1 }}
        >
          {notice.title}
        </Text>
      </View>

      {/* Date */}
      <Text className="text-label text-muted-foreground" style={{ marginTop: 4 }}>
        {formatDate(notice.published_at)}
      </Text>
    </Pressable>
  );
}
