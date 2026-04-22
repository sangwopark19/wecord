import { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');
const CARD_SIZE = (screenWidth - 16 * 2 - 12) / 2;

interface Community {
  id: string;
  name: string;
  cover_image_url: string | null;
  slug: string;
}

function CreatorCard({
  item,
  isSelected,
  onToggle,
}: {
  item: Community;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: CARD_SIZE,
          borderRadius: 12,
          overflow: 'hidden',
        }}
        className={`bg-card py-4 px-2 items-center ${
          isSelected ? 'border-2 border-accent' : 'border-2 border-transparent'
        }`}
      >
        {isSelected && (
          <View className="absolute top-2 right-2 z-10">
            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
          </View>
        )}
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
        ) : (
          <View
            style={{ width: 60, height: 60, borderRadius: 30 }}
            className="bg-accent items-center justify-center"
          >
            <Text className="text-heading font-semibold text-[#000000]">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-body font-regular text-foreground text-center mt-2" numberOfLines={1}>
          {item.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View
      style={{ width: CARD_SIZE, borderRadius: 12 }}
      className="bg-input py-4 px-2 items-center"
    >
      <View style={{ width: 60, height: 60, borderRadius: 30 }} className="bg-border" />
      <View className="h-3 w-16 bg-border rounded mt-2" />
    </View>
  );
}

export default function CurateScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const { data: creators, isLoading } = useQuery({
    queryKey: ['curate-communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, cover_image_url, slug')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Community[];
    },
    staleTime: Infinity,
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSkip = () => {
    router.push('/(onboarding)/complete' as never);
  };

  const handleContinue = async () => {
    if (selectedIds.size === 0) {
      handleSkip();
      return;
    }

    if (!user) return;
    setLoading(true);

    try {
      const rows = await Promise.all(
        Array.from(selectedIds).map(async (communityId) => {
          const { data } = await supabase.functions.invoke('generate-nickname');
          return {
            user_id: user.id,
            community_id: communityId,
            community_nickname: data.nickname as string,
            role: 'member' as const,
          };
        })
      );

      await supabase.from('community_members').insert(rows);
      router.push('/(onboarding)/complete' as never);
    } finally {
      setLoading(false);
    }
  };

  const ctaLabel = selectedIds.size > 0 ? t('curate.cta') : t('curate.skip');

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <View className="flex-1">
        <Pressable
          onPress={handleSkip}
          className="absolute top-0 right-4 z-10 p-4"
          hitSlop={8}
        >
          <Text className="text-body font-regular text-muted-foreground">{t('curate.skip')}</Text>
        </Pressable>

        <Text className="text-heading font-semibold text-foreground mt-6 mx-4">
          {t('curate.title')}
        </Text>
        <Text className="text-body font-regular text-muted-foreground mt-2 mx-4">
          {t('curate.body')}
        </Text>

        {isLoading ? (
          <View className="flex-row flex-wrap gap-3 px-4 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : creators?.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-heading font-semibold text-foreground text-center">
              {t('curate.empty_heading')}
            </Text>
            <Text className="text-body font-regular text-muted-foreground text-center mt-2">
              {t('curate.empty_body')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={creators}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              gap: 12,
            }}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <CreatorCard
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggle={() => toggleSelection(item.id)}
              />
            )}
          />
        )}
      </View>

      <View className="pb-6">
        <PrimaryCTAButton
          label={ctaLabel}
          onPress={handleContinue}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}
