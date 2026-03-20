import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface MediaGridProps {
  mediaUrls: string[];
  postType: 'image' | 'video';
}

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function MediaGrid({ mediaUrls, postType }: MediaGridProps) {
  if (mediaUrls.length === 0) return null;

  if (postType === 'video') {
    return (
      <View className="w-full rounded-lg overflow-hidden relative mt-2" style={{ aspectRatio: 16 / 9 }}>
        <Image
          source={{ uri: mediaUrls[0] }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          placeholder={{ blurhash: BLURHASH }}
        />
        <View className="absolute inset-0 items-center justify-center">
          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
        </View>
      </View>
    );
  }

  const count = mediaUrls.length;

  if (count === 1) {
    return (
      <View className="w-full rounded-lg overflow-hidden mt-2" style={{ aspectRatio: 16 / 9 }}>
        <Image
          source={{ uri: mediaUrls[0] }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          placeholder={{ blurhash: BLURHASH }}
        />
      </View>
    );
  }

  if (count === 2) {
    return (
      <View className="flex-row gap-1 mt-2">
        {mediaUrls.map((uri, i) => (
          <View key={i} className="flex-1 rounded-lg overflow-hidden" style={{ aspectRatio: 1 }}>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
            />
          </View>
        ))}
      </View>
    );
  }

  if (count === 3) {
    return (
      <View className="flex-row gap-1 mt-2" style={{ height: 160 }}>
        {/* Large left cell (2/3 width) */}
        <View className="rounded-lg overflow-hidden" style={{ flex: 2 }}>
          <Image
            source={{ uri: mediaUrls[0] }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
          />
        </View>
        {/* 2 stacked right cells (1/3 width) */}
        <View className="gap-1" style={{ flex: 1 }}>
          {mediaUrls.slice(1, 3).map((uri, i) => (
            <View key={i} className="flex-1 rounded-lg overflow-hidden">
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                placeholder={{ blurhash: BLURHASH }}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // 4+ images: 2x2 grid, last cell shows +{remaining}
  const displayUrls = mediaUrls.slice(0, 4);
  const remaining = count - 4;

  return (
    <View className="mt-2" style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {displayUrls.slice(0, 2).map((uri, i) => (
          <View key={i} className="flex-1 rounded-lg overflow-hidden" style={{ aspectRatio: 1 }}>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {displayUrls.slice(2, 4).map((uri, i) => (
          <View
            key={i}
            className="flex-1 rounded-lg overflow-hidden"
            style={{ aspectRatio: 1, position: 'relative' }}
          >
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
            />
            {i === 1 && remaining > 0 && (
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                <Text className="text-foreground text-heading font-semibold">+{remaining}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
