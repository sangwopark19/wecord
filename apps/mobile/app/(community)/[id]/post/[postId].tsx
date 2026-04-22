import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuthStore } from '../../../../stores/authStore';
import { useDeletePost } from '../../../../hooks/post/useDeletePost';
import { useLike } from '../../../../hooks/post/useLike';
import { useComments } from '../../../../hooks/comment/useComments';
import { useCreateComment } from '../../../../hooks/comment/useCreateComment';
import { useDeleteComment } from '../../../../hooks/comment/useDeleteComment';
import { PostCard } from '../../../../components/post/PostCard';
import { LikeButton } from '../../../../components/post/LikeButton';
import { CommentRow } from '../../../../components/comment/CommentRow';
import { ReplyRow } from '../../../../components/comment/ReplyRow';
import { ReportBottomSheet } from '../../../../components/report/ReportBottomSheet';
import { showDeleteConfirmDialog } from '../../../../components/post/DeleteConfirmDialog';
import { PostWithNickname } from '../../../../hooks/post/useFanFeed';

const MAX_COMMENT_LENGTH = 500;
const CHAR_COUNTER_THRESHOLD = 450;

export default function PostDetailScreen() {
  const { id, postId } = useLocalSearchParams<{ id: string; postId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const deletePost = useDeletePost();
  const likePost = useLike('post');
  const likeComment = useLike('comment');
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    nickname: string;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
  } | null>(null);

  const postQueryKey = ['post', postId];
  const feedQueryKey = ['fanFeed', id];

  const { data: post, isLoading } = useQuery({
    queryKey: postQueryKey,
    queryFn: async (): Promise<PostWithNickname | null> => {
      const { data, error } = await supabase
        .from('posts_with_nickname')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Merge isLiked
      let isLiked = false;
      if (user && data) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .eq('target_id', postId)
          .maybeSingle();
        isLiked = !!likeData;
      }

      return { ...(data as Omit<PostWithNickname, 'isLiked'>), isLiked };
    },
    enabled: !!postId,
  });

  const { data: commentsData } = useComments(postId ?? '');

  const isOwnPost = user && post?.author_id === user.id;

  const handleDeletePost = () => {
    if (!post) return;
    showDeleteConfirmDialog(() => {
      deletePost.mutate(post.id, {
        onSuccess: () => {
          router.back();
        },
      });
    });
  };

  const handlePostLike = () => {
    if (!post || !user) return;
    likePost.mutate({
      targetId: post.id,
      isLiked: post.isLiked,
      userId: user.id,
      feedQueryKey,
    });
  };

  const handleCommentLike = (commentId: string, isLiked: boolean) => {
    if (!user) return;
    likeComment.mutate({
      targetId: commentId,
      isLiked,
      userId: user.id,
      feedQueryKey: ['comments', postId],
    });
  };

  const handleSendComment = () => {
    if (!user || !postId || !id || commentText.trim().length === 0) return;

    createComment.mutate(
      {
        postId,
        content: commentText.trim(),
        parentCommentId: replyTarget?.commentId ?? null,
        communityId: id,
      },
      {
        onSuccess: () => {
          setCommentText('');
          setReplyTarget(null);
        },
      }
    );
  };

  const handleReply = (commentId: string, nickname: string) => {
    setReplyTarget({ commentId, nickname });
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-body text-muted-foreground">게시글을 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  const rootComments = commentsData?.rootComments ?? [];
  const hasContent = commentText.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-input">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text className="flex-1 text-heading font-semibold text-foreground ml-2">게시글</Text>

        {isOwnPost && (
          <Pressable
            onPress={handleDeletePost}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="더보기"
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#999999" />
          </Pressable>
        )}
      </View>

      {/* Scrollable content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView className="flex-1">
          {/* PostCard with full text (no clamp) and like wired up */}
          <View className="p-4">
            <PostCard
              post={post}
              clampLines={0}
              communityId={id}
              onLike={handlePostLike}
              onDelete={isOwnPost ? handleDeletePost : undefined}
              onReport={!isOwnPost ? () => setReportTarget({ type: 'post', id: post.id }) : undefined}
            />
          </View>

          {/* Comment section */}
          <View className="px-4 pt-2 pb-4">
            <Text className="text-heading font-semibold text-foreground mb-3">
              댓글 {post.comment_count}
            </Text>

            {rootComments.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-body text-muted-foreground">아직 댓글이 없어요.</Text>
                <Text className="text-label text-muted-foreground mt-1">
                  첫 번째 댓글을 달아보세요.
                </Text>
              </View>
            ) : (
              rootComments.map((rootComment) => (
                <View key={rootComment.id}>
                  <CommentRow
                    comment={rootComment}
                    currentUserId={user?.id}
                    onReply={(commentId) =>
                      handleReply(commentId, rootComment.author.community_nickname)
                    }
                    onLike={() => handleCommentLike(rootComment.id, rootComment.isLiked)}
                    onDelete={
                      user?.id === rootComment.author_id
                        ? () =>
                            deleteComment.mutate({
                              commentId: rootComment.id,
                              postId: postId ?? '',
                            })
                        : undefined
                    }
                    onReport={
                      user?.id !== rootComment.author_id
                        ? () => setReportTarget({ type: 'comment', id: rootComment.id })
                        : undefined
                    }
                  />
                  {rootComment.replies.map((reply) => (
                    <ReplyRow
                      key={reply.id}
                      comment={reply}
                      currentUserId={user?.id}
                      onLike={() => handleCommentLike(reply.id, reply.isLiked)}
                      onDelete={
                        user?.id === reply.author_id
                          ? () =>
                              deleteComment.mutate({
                                commentId: reply.id,
                                postId: postId ?? '',
                              })
                          : undefined
                      }
                      onReport={
                        user?.id !== reply.author_id
                          ? () => setReportTarget({ type: 'comment', id: reply.id })
                          : undefined
                      }
                    />
                  ))}
                </View>
              ))
            )}
          </View>

          {/* Bottom padding to clear the input bar */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Comment input bar */}
        <View className="bg-background border-t border-input px-4 pt-2 pb-3">
          {/* Reply indicator */}
          {replyTarget && (
            <View className="flex-row items-center justify-between mb-2 px-1">
              <Text className="text-label text-muted-foreground">
                @{replyTarget.nickname}에게 답글 중
              </Text>
              <Pressable
                onPress={handleCancelReply}
                accessibilityRole="button"
                accessibilityLabel="답글 취소"
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={16} color="#999999" />
              </Pressable>
            </View>
          )}

          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-input text-foreground text-body rounded-xl px-3 py-2"
              placeholder="댓글을 입력하세요..."
              placeholderTextColor="#999999"
              value={commentText}
              onChangeText={setCommentText}
              maxLength={MAX_COMMENT_LENGTH}
              multiline
              style={{ maxHeight: 100 }}
            />
            <Pressable
              onPress={handleSendComment}
              disabled={!hasContent || createComment.isPending}
              accessibilityRole="button"
              accessibilityLabel="댓글 보내기"
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="send"
                size={22}
                color={hasContent && !createComment.isPending ? '#8B5CF6' : '#666666'}
              />
            </Pressable>
          </View>

          {/* Character counter when > 450 */}
          {commentText.length > CHAR_COUNTER_THRESHOLD && (
            <Text className="text-label text-muted-foreground mt-1 text-right">
              {commentText.length}/{MAX_COMMENT_LENGTH}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Report bottom sheet */}
      <ReportBottomSheet
        visible={!!reportTarget}
        targetType={reportTarget?.type ?? 'post'}
        targetId={reportTarget?.id ?? ''}
        onClose={() => setReportTarget(null)}
      />
    </SafeAreaView>
  );
}
