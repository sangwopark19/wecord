import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PostWithNickname } from '../../hooks/post/useFanFeed';
import { useAuthStore } from '../../stores/authStore';
import { MediaGrid } from './MediaGrid';
import { CreatorBadge } from './CreatorBadge';
import { LikeButton } from './LikeButton';
import { Avatar, getSeedFromString } from '../common/CoverGrad';
import { useTranslate } from '../../hooks/post/useTranslate';
import { TranslateButton } from './TranslateButton';
import { TranslatedTextBlock } from './TranslatedTextBlock';
import { CommunityChip } from '../home/CommunityChip';
import { HighlightedText } from '../search/HighlightedText';
import { showDeleteConfirmDialog } from './DeleteConfirmDialog';

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
  onReport?: () => void;
  clampLines?: number;
  communityId?: string;
  showCommunityChip?: boolean;
  highlightQuery?: string;
}

export function PostCard({ post, onLike, onDelete, onReport, clampLines = 3, communityId, showCommunityChip, highlightQuery }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { translatedText, isTranslated, isLoading, error, translate } = useTranslate(post.id, 'post');

  const isOwnPost = post.author_id === user?.id;

  const handleMorePress = () => {
    if (isOwnPost && onDelete) {
      showDeleteConfirmDialog(onDelete);
    } else if (!isOwnPost && onReport) {
      onReport();
    }
  };

  const showMoreButton = (isOwnPost && onDelete) || (!isOwnPost && onReport);

  const handlePostPress = () => {
    const cid = communityId ?? post.community_id;
    router.push(`/(community)/${cid}/post/${post.id}` as never);
  };

  const handleProfilePress = () => {
    // Do not navigate to profile when tapping own posts
    if (post.author_id === user?.id) return;
    const cid = communityId ?? post.community_id;
    router.push(`/(community)/${cid}/profile/${post.author_cm_id}` as never);
  };

  return (
    <View className="bg-card rounded-xl p-4 mb-2">
      {/* Community chip — shown in unified home feed */}
      {showCommunityChip && (
        <CommunityChip
          communityId={post.community_id}
          communityName={post.community_name}
        />
      )}

      {/* Header row — tappable to navigate to author profile */}
      <Pressable
        className="flex-row items-start"
        onPress={handleProfilePress}
        accessibilityRole="link"
        accessibilityLabel={post.author_nickname}
      >
        {/* Avatar — initials on seeded color */}
        <View style={{ marginRight: 12, flexShrink: 0 }}>
          <Avatar
            name={post.author_nickname}
            seed={getSeedFromString(post.author_cm_id ?? post.author_id)}
            size={40}
          />
        </View>

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
      </Pressable>

      {/* Tappable content area (body + media) */}
      <Pressable
        onPress={handlePostPress}
        accessibilityRole="link"
        accessibilityLabel={post.content.substring(0, 50)}
      >
        {/* Body */}
        {highlightQuery ? (
          <HighlightedText
            text={post.content}
            query={highlightQuery}
            style={{ fontSize: 14, lineHeight: 21, color: '#FFFFFF', marginTop: 8 }}
          />
        ) : (
          <Text
            className="text-body font-regular text-foreground mt-2"
            numberOfLines={clampLines === 0 ? undefined : clampLines}
          >
            {post.content}
          </Text>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <MediaGrid
            mediaUrls={post.media_urls}
            postType={post.post_type === 'video' ? 'video' : 'image'}
          />
        )}
      </Pressable>

      {/* Translation — outside the tappable area, between content and action bar */}
      <TranslateButton
        isTranslated={isTranslated}
        isLoading={isLoading}
        error={error}
        onPress={translate}
      />
      {isTranslated && translatedText && (
        <TranslatedTextBlock translatedText={translatedText} />
      )}

      {/* Action bar — outside the tappable area to avoid nested buttons */}
      <View className="flex-row items-center mt-3 gap-4">
        {/* Like */}
        <LikeButton
          isLiked={post.isLiked}
          likeCount={post.like_count}
          onPress={onLike ?? (() => {})}
          size="sm"
        />

        {/* Comment */}
        <View
          className="flex-row items-center gap-1"
          style={{ minHeight: 44, alignItems: 'center' }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#999999" />
          <Text className="text-label text-muted-foreground">{post.comment_count}</Text>
        </View>

        {/* More menu */}
        {showMoreButton && (
          <Pressable
            onPress={handleMorePress}
            className="ml-auto w-11 h-11 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="더보기"
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#999999" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
