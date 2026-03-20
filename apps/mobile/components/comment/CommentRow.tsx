import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreatorBadge } from '../post/CreatorBadge';
import { LikeButton } from '../post/LikeButton';
import type { Comment } from '../../hooks/comment/useComments';

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

interface CommentRowProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (commentId: string) => void;
  onLike: () => void;
  onDelete?: () => void;
}

export function CommentRow({
  comment,
  currentUserId,
  onReply,
  onLike,
  onDelete,
}: CommentRowProps) {
  const isCreator = comment.author_role === 'creator';
  const isOwnComment = currentUserId === comment.author_id;

  const handleDelete = () => {
    Alert.alert(
      '댓글 삭제',
      '정말 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View className="py-3 px-4 border-b border-input">
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="w-8 h-8 rounded-full bg-card mr-3 flex-shrink-0" />

        {/* Content column */}
        <View className="flex-1">
          {/* Nickname row */}
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text
              className={`text-body font-semibold ${isCreator ? 'text-teal' : 'text-foreground'}`}
            >
              {comment.author.community_nickname}
            </Text>
            {isCreator && <CreatorBadge />}
            <Text className="text-label text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </Text>
          </View>

          {/* Comment body */}
          <Text className="text-body font-regular text-foreground mt-1">
            {comment.content}
          </Text>

          {/* Action row */}
          <View className="flex-row items-center gap-3 mt-2">
            <LikeButton
              isLiked={comment.isLiked}
              likeCount={comment.like_count}
              onPress={onLike}
              size="sm"
            />

            <Pressable
              onPress={() => onReply(comment.id)}
              className="items-center justify-center"
              style={{ minHeight: 44, paddingHorizontal: 4 }}
              accessibilityRole="button"
              accessibilityLabel="답글"
            >
              <Text className="text-label text-muted-foreground">답글</Text>
            </Pressable>

            {isOwnComment && onDelete && (
              <Pressable
                onPress={handleDelete}
                className="items-center justify-center"
                style={{ minHeight: 44, minWidth: 44 }}
                accessibilityRole="button"
                accessibilityLabel="댓글 삭제"
              >
                <Ionicons name="trash-outline" size={16} color="#999999" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
