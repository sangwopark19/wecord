import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PostWithNickname } from '../../hooks/post/useFanFeed';
import { MediaGrid } from './MediaGrid';
import { CreatorBadge } from './CreatorBadge';

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

interface PostCardProps {
  post: PostWithNickname;
  onLike?: () => void;
  onDelete?: () => void;
  clampLines?: number;
  communityId?: string;
}

export function PostCard({ post, onLike, onDelete, clampLines = 3, communityId }: PostCardProps) {
  const router = useRouter();

  const handlePress = () => {
    const cid = communityId ?? post.community_id;
    router.push(`/(community)/${cid}/post/${post.id}` as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-card rounded-xl p-4 mb-2"
      accessibilityRole="button"
      accessibilityLabel={`${post.author_nickname}: ${post.content.substring(0, 50)}`}
    >
      {/* Header row */}
      <View className="flex-row items-start">
        {/* Avatar placeholder */}
        <View className="w-10 h-10 rounded-full bg-input mr-3 flex-shrink-0" />

        {/* Author info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-body font-semibold text-foreground">
              {post.author_nickname}
            </Text>
            {post.author_role === 'creator' && <CreatorBadge />}
          </View>
          <Text className="text-label text-muted-foreground mt-0.5">
            {formatRelativeTime(post.created_at ?? '')}
          </Text>
        </View>

        {/* More menu */}
        {onDelete && (
          <Pressable
            onPress={onDelete}
            className="w-11 h-11 items-center justify-center -mr-2"
            accessibilityRole="button"
            accessibilityLabel="더보기"
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#999999" />
          </Pressable>
        )}
      </View>

      {/* Body */}
      <Text
        className="text-body font-regular text-foreground mt-2"
        numberOfLines={clampLines === 0 ? undefined : clampLines}
      >
        {post.content}
      </Text>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <MediaGrid
          mediaUrls={post.media_urls}
          postType={post.post_type === 'video' ? 'video' : 'image'}
        />
      )}

      {/* Action bar */}
      <View className="flex-row items-center mt-3 gap-4">
        {/* Like */}
        <Pressable
          onPress={onLike}
          className="flex-row items-center gap-1"
          style={{ minHeight: 44, alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={post.isLiked ? '좋아요 취소' : '좋아요'}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLiked ? '#00E5C3' : '#999999'}
          />
          <Text className="text-label text-muted-foreground">{post.like_count}</Text>
        </Pressable>

        {/* Comment */}
        <View
          className="flex-row items-center gap-1"
          style={{ minHeight: 44, alignItems: 'center' }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#999999" />
          <Text className="text-label text-muted-foreground">{post.comment_count}</Text>
        </View>
      </View>
    </Pressable>
  );
}
