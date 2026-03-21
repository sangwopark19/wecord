import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHighlight } from '../../hooks/highlight/useHighlight';
import { useTranslation } from '@wecord/shared/i18n';
import { HighlightSectionHeader } from './HighlightSectionHeader';
import { HorizontalCardScroll } from './HorizontalCardScroll';
import { CompactPostCard } from './CompactPostCard';
import { CalendarPlaceholderCard } from './CalendarPlaceholderCard';
import { NoticeListCard } from './NoticeListCard';
import { ArtistMemberCard } from './ArtistMemberCard';

// Skeleton shimmer animation component
function SkeletonBar({ width, height }: { width: number; height: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        opacity,
      }}
    />
  );
}

function HighlightSkeleton() {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 16, gap: 24 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ gap: 8 }}>
          {/* Section header skeleton */}
          <View className="flex-row justify-between items-center px-4">
            <SkeletonBar width={120} height={16} />
            <SkeletonBar width={40} height={12} />
          </View>
          {/* Card row skeleton */}
          <View className="flex-row gap-2 px-4">
            {[1, 2, 3].map((j) => (
              <SkeletonBar key={j} width={120} height={160} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export interface HighlightScreenProps {
  communityId: string;
}

export default function HighlightScreen({ communityId }: HighlightScreenProps) {
  const { t } = useTranslation('highlight');
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useHighlight(communityId);

  if (isLoading) {
    return <HighlightSkeleton />;
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ paddingTop: 64 }}>
        <Text className="text-body text-muted-foreground text-center">{t('error.load')}</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          style={{ marginTop: 16, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: '#00E5C3' }} className="text-body">
            {t('retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const hasContent =
    (data?.notices?.length ?? 0) > 0 ||
    (data?.creatorPosts?.length ?? 0) > 0 ||
    (data?.fanPosts?.length ?? 0) > 0 ||
    (data?.artistMembers?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ paddingTop: 64 }}>
        <Ionicons name="sparkles-outline" size={48} color="#666666" />
        <Text className="text-heading font-semibold text-foreground mt-4 text-center">
          {t('empty.heading')}
        </Text>
        <Text className="text-body text-muted-foreground mt-2 text-center">{t('empty.body')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingVertical: 16, gap: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#00E5C3"
        />
      }
    >
      {/* Section 1: Notices */}
      {(data?.notices?.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <HighlightSectionHeader
            title={t('sections.notices')}
            onSeeMore={() => router.push(`/(community)/${communityId}/notices` as never)}
          />
          <HorizontalCardScroll
            data={data!.notices}
            keyExtractor={(notice) => notice.id}
            renderItem={(notice) => (
              <NoticeListCard
                notice={notice}
                onPress={() => router.push(`/(community)/${communityId}/notices` as never)}
              />
            )}
          />
        </View>
      )}

      {/* Section 2: Calendar */}
      <View style={{ gap: 8 }}>
        <HighlightSectionHeader title={t('sections.calendar')} />
        <CalendarPlaceholderCard />
      </View>

      {/* Section 3: Creator Posts */}
      {(data?.creatorPosts?.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <HighlightSectionHeader
            title={t('sections.creatorPosts')}
            onSeeMore={() => router.push(`/(community)/${communityId}` as never)}
          />
          <HorizontalCardScroll
            data={data!.creatorPosts}
            keyExtractor={(post) => post.id}
            renderItem={(post) => (
              <CompactPostCard post={post} communityId={communityId} />
            )}
          />
        </View>
      )}

      {/* Section 4: Fan Posts */}
      {(data?.fanPosts?.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <HighlightSectionHeader
            title={t('sections.fanPosts')}
            onSeeMore={() => router.push(`/(community)/${communityId}` as never)}
          />
          <HorizontalCardScroll
            data={data!.fanPosts}
            keyExtractor={(post) => post.id}
            renderItem={(post) => (
              <CompactPostCard post={post} communityId={communityId} />
            )}
          />
        </View>
      )}

      {/* Section 5: Artist Members */}
      {(data?.artistMembers?.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <HighlightSectionHeader
            title={t('sections.artistMembers')}
            onSeeMore={() => router.push(`/(community)/${communityId}` as never)}
          />
          <HorizontalCardScroll
            data={data!.artistMembers}
            keyExtractor={(member) => member.id}
            renderItem={(member) => (
              <ArtistMemberCard
                member={member}
                onPress={() => router.push(`/(community)/${communityId}` as never)}
              />
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}
