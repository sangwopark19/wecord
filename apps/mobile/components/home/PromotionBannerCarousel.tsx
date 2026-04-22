import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CoverGrad, getSeedFromString } from '../common/CoverGrad';

interface PromotionBanner {
  id: string;
  image_url: string;
  link_url: string;
}

interface PromotionBannerCarouselProps {
  banners: PromotionBanner[];
}

const BANNER_HEIGHT = 260;

export function PromotionBannerCarousel({ banners }: PromotionBannerCarouselProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<PromotionBanner>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = useCallback(() => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 6000);
  }, [banners.length]);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={{ height: BANNER_HEIGHT, width: screenWidth, position: 'relative' }}>
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
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const isLive = index === 0;
          const seed = getSeedFromString(item.id);
          return (
            <Pressable
              onPress={() => router.push(item.link_url as never)}
              accessibilityRole="link"
              accessibilityLabel="프로모션 배너"
              style={{ width: screenWidth, height: BANNER_HEIGHT }}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: screenWidth, height: BANNER_HEIGHT }}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel="프로모션 배너 이미지"
                />
              ) : (
                <CoverGrad
                  seed={seed}
                  r={index}
                  style={{ width: screenWidth, height: BANNER_HEIGHT }}
                />
              )}
              <LinearGradient
                colors={['rgba(11,11,15,0)', 'rgba(11,11,15,0.85)']}
                locations={[0.4, 1]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View style={{ position: 'absolute', left: 16, right: 16, bottom: 32 }}>
                {isLive && (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#E11D48',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontFamily: 'Pretendard-Bold',
                        fontSize: 10,
                        letterSpacing: 0.6,
                      }}
                    >
                      LIVE
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 10,
                    letterSpacing: 1.2,
                    marginBottom: 4,
                  }}
                >
                  FEATURED
                </Text>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'Pretendard-ExtraBold',
                    fontSize: 22,
                    letterSpacing: -0.4,
                    lineHeight: 26,
                  }}
                  numberOfLines={2}
                >
                  {getBannerHeadline(index)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      {banners.length > 1 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {banners.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentIndex ? 14 : 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const HEADLINES = [
  '[HALO8] SERENADE — ON STAGE MACAO',
  'New single "Mirror" out now',
  'Fan Meeting 2026 · Seoul',
];

function getBannerHeadline(index: number): string {
  return HEADLINES[index % HEADLINES.length] ?? 'Featured';
}
