import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase';
import { useAuthStore } from '../../../../stores/authStore';
import { useDeletePost } from '../../../../hooks/post/useDeletePost';
import { PostCard } from '../../../../components/post/PostCard';
import { showDeleteConfirmDialog } from '../../../../components/post/DeleteConfirmDialog';
import { PostWithNickname } from '../../../../hooks/post/useFanFeed';

export default function PostDetailScreen() {
  const { id, postId } = useLocalSearchParams<{ id: string; postId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const deletePost = useDeletePost();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
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

  const isOwnPost = user && post?.author_id === user.id;

  const handleDelete = () => {
    if (!post) return;
    showDeleteConfirmDialog(() => {
      deletePost.mutate(post.id, {
        onSuccess: () => {
          router.back();
        },
      });
    });
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

  return (
    <SafeAreaView className="flex-1 bg-background">
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
            onPress={handleDelete}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="더보기"
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#999999" />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        <View className="p-4">
          <PostCard
            post={post}
            clampLines={0}
            communityId={id}
            onDelete={isOwnPost ? handleDelete : undefined}
          />
        </View>

        {/* Comment section placeholder */}
        <View className="px-4 pt-2 pb-8">
          <Text className="text-heading font-semibold text-foreground mb-3">
            댓글 {post.comment_count}
          </Text>
          <View className="bg-card rounded-xl p-4 items-center">
            <Text className="text-body text-muted-foreground">Comments coming soon</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
