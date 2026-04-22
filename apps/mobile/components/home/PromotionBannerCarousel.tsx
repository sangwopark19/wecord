import { useRef, useState, useCallback, useEffect } from 'react';
import { View, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

interface PromotionBanner {
  id: string;
  image_url: string;
  link_url: string;
}

interface PromotionBannerCarouselProps {
  banners: PromotionBanner[];
}

export function PromotionBannerCarousel({ banners }: PromotionBannerCarouselProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<PromotionBanner>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!banners || banners.length === 0) {
    return null;
  }

  const startAutoScroll = useCallback(() => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
  }, [banners.length]);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start auto-scroll on mount; cleanup on unmount
  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
    };
  }, [startAutoScroll, stopAutoScroll]);

  const handleScrollBeginDrag = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleScrollEndDrag = useCallback(() => {
    startAutoScroll();
  }, [startAutoScroll]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const first = viewableItems[0];
      if (first && first.index !== null) {
        setCurrentIndex(first.index);
      }
    },
    []
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const bannerHeight = screenWidth * (9 / 16);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ width: screenWidth }}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.link_url as never)}
            accessibilityRole="link"
            accessibilityLabel="프로모션 배너"
            style={{ width: screenWidth, height: bannerHeight }}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: screenWidth, height: bannerHeight }}
                contentFit="cover"
                transition={200}
                accessibilityLabel="프로모션 배너 이미지"
              />
            ) : (
              <View style={{ width: screenWidth, height: bannerHeight }} className="bg-input" />
            )}
          </Pressable>
        )}
      />

      {/* Dot indicator — only when more than 1 banner */}
      {banners.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 8,
            gap: 4,
          }}
        >
          {banners.map((_, index) => (
            <View
              key={index}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === currentIndex ? '#8B5CF6' : '#2A2A2A',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
