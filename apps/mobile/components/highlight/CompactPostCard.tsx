import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { HighlightPost } from '../../hooks/highlight/useHighlight';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

interface CompactPostCardProps {
  post: HighlightPost;
  communityId: string;
}

export function CompactPostCard({ post, communityId }: CompactPostCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/(community)/${communityId}/post/${post.id}` as never);
  };

  const thumbnailUrl = post.media_urls?.[0];

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${post.author_nickname}: ${post.content.substring(0, 30)}`}
      className="bg-card rounded-xl overflow-hidden"
      style={{ width: 120, height: 160 }}
    >
      {/* Thumbnail — top 60% (96px) */}
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ width: 120, height: 96 }}
          contentFit="cover"
        />
      ) : (
        <View className="bg-input" style={{ width: 120, height: 96 }} />
      )}

      {/* Content — bottom 40% (64px) */}
      <View style={{ height: 64, padding: 8, justifyContent: 'space-between' }}>
        <Text className="text-label font-regular text-foreground" numberOfLines={1}>
          {post.author_nickname}
        </Text>
        <Text className="text-label font-regular text-muted-foreground" numberOfLines={1}>
          {post.content}
        </Text>
        <Text className="text-label text-muted-foreground" numberOfLines={1}>
          {formatRelativeTime(post.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}
