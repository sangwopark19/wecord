import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useCommunityStore } from '../../stores/communityStore';
import { useCommunityMember } from '../../hooks/community/useCommunityMember';
import { useCreatePost } from '../../hooks/post/useCreatePost';

const MAX_CHARS = 2000;
const CHAR_COUNTER_THRESHOLD = 1800;
const MAX_IMAGES = 10;

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface MediaThumbnailGridProps {
  items: MediaItem[];
  onRemove: (index: number) => void;
}

function MediaThumbnailGrid({ items, onRemove }: MediaThumbnailGridProps) {
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
    >
      {items.map((item, index) => (
        <View key={index} style={{ width: 80, height: 80, position: 'relative' }}>
          <Image
            source={{ uri: item.uri }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            contentFit="cover"
          />
          {item.type === 'video' && (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          <Pressable
            onPress={() => onRemove(index)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="미디어 제거"
          >
            <Ionicons name="close" size={12} color="#FFFFFF" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

export default function ComposeScreen() {
  const router = useRouter();
  const { t } = useTranslation('community');
  const { user } = useAuthStore();
  const { activeCommunityId } = useCommunityStore();

  // communityId can come from route params or store
  const params = useLocalSearchParams<{ communityId?: string }>();
  const communityId = params.communityId ?? activeCommunityId ?? '';

  const { data: membership } = useCommunityMember(communityId);
  const createPost = useCreatePost();

  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!user) return null;

  const hasImages = mediaItems.some((m) => m.type === 'image');
  const hasVideo = mediaItems.some((m) => m.type === 'video');
  const imageCount = mediaItems.filter((m) => m.type === 'image').length;

  const canPublish = content.trim().length > 0 && !isPublishing;

  const handlePickImages = async () => {
    if (hasVideo) return;
    const remaining = MAX_IMAGES - imageCount;
    if (remaining <= 0) return;

    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newItems = result.assets.map((a) => ({ uri: a.uri, type: 'image' as const }));
      setMediaItems((prev) => [...prev, ...newItems]);
    }
  };

  const handlePickVideo = async () => {
    if (hasImages) return;

    const result = await launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setMediaItems([{ uri: result.assets[0].uri, type: 'video' }]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!canPublish || !communityId) return;

    const postType = hasVideo ? 'video' : hasImages ? 'image' : 'text';

    setIsPublishing(true);
    try {
      await createPost.mutateAsync({
        communityId,
        content: content.trim(),
        mediaUris: mediaItems.map((m) => m.uri),
        postType,
      });
      router.back();
    } catch {
      // Error already shown in hook via Alert
    } finally {
      setIsPublishing(false);
    }
  };

  const handleContentChange = (text: string) => {
    if (text.length > MAX_CHARS) {
      Alert.alert('', t('common.charLimitExceeded', { max: MAX_CHARS }));
      return;
    }
    setContent(text);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-input">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>

        <Text className="flex-1 text-center text-heading font-semibold text-foreground">
          {t('post.compose.title')}
        </Text>

        <Pressable
          onPress={handlePublish}
          disabled={!canPublish}
          className="w-16 h-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="발행"
          accessibilityState={{ disabled: !canPublish }}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#00E5C3" />
          ) : (
            <Text
              className={`text-body font-semibold ${canPublish ? 'text-teal' : 'text-subtle'}`}
            >
              {t('post.compose.publish')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Community nickname display */}
      {membership && (
        <View className="flex-row items-center px-4 py-3 gap-3">
          <View className="w-10 h-10 rounded-full bg-input" />
          <Text className="text-body font-semibold text-foreground">
            {membership.community_nickname}
          </Text>
        </View>
      )}

      {/* Text input */}
      <View className="flex-1 px-4">
        <TextInput
          multiline
          value={content}
          onChangeText={handleContentChange}
          placeholder="무슨 생각을 하고 있나요?"
          placeholderTextColor="#666666"
          maxLength={MAX_CHARS}
          className="flex-1 text-body text-foreground bg-background"
          style={{ textAlignVertical: 'top', minHeight: 120 }}
          autoFocus
        />

        {content.length > CHAR_COUNTER_THRESHOLD && (
          <Text className="text-label text-muted-foreground text-right mb-2">
            {content.length}/{MAX_CHARS}
          </Text>
        )}
      </View>

      {/* Media thumbnails */}
      <MediaThumbnailGrid items={mediaItems} onRemove={handleRemoveMedia} />

      {/* Bottom bar */}
      <View className="flex-row items-center px-4 py-3 border-t border-input gap-4">
        <Pressable
          onPress={handlePickImages}
          disabled={hasVideo || imageCount >= MAX_IMAGES}
          className="w-11 h-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="이미지 추가"
          accessibilityState={{ disabled: hasVideo || imageCount >= MAX_IMAGES }}
        >
          <Ionicons
            name="image-outline"
            size={28}
            color={hasVideo || imageCount >= MAX_IMAGES ? '#666666' : '#FFFFFF'}
          />
        </Pressable>

        <Pressable
          onPress={handlePickVideo}
          disabled={hasImages}
          className="w-11 h-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="동영상 추가"
          accessibilityState={{ disabled: hasImages }}
        >
          <Ionicons
            name="videocam-outline"
            size={28}
            color={hasImages ? '#666666' : '#FFFFFF'}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
