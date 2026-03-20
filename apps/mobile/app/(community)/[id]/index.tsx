import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useCommunityStore } from '../../../stores/communityStore';
import { useCommunityMember } from '../../../hooks/community/useCommunityMember';
import { useLeaveCommunity } from '../../../hooks/community/useLeaveCommunity';
import { CommunityTabBar } from '../../../components/community/CommunityTabBar';
import { useLeaveConfirmDialog } from '../../../components/community/LeaveConfirmDialog';
import { useHighlight } from '../../../hooks/highlight/useHighlight';
import { HighlightSectionHeader } from '../../../components/highlight/HighlightSectionHeader';
import { HorizontalCardScroll } from '../../../components/highlight/HorizontalCardScroll';
import { CompactPostCard } from '../../../components/highlight/CompactPostCard';
import { CalendarPlaceholderCard } from '../../../components/highlight/CalendarPlaceholderCard';
import { NoticeListCard } from '../../../components/highlight/NoticeListCard';
import { ArtistMemberCard } from '../../../components/highlight/ArtistMemberCard';
import { useTranslation } from '@wecord/shared/i18n';
import FanTab from './fan';
import ArtistTab from './artist';

type TabKey = 'fan' | 'artist' | 'highlight';

interface Community {
  id: string;
  name: string;
  cover_image_url: string | null;
  type: 'solo' | 'group';
}

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

interface HighlightScreenProps {
  communityId: string;
  setActiveTab: (tab: TabKey) => void;
  router: ReturnType<typeof useRouter>;
}

function HighlightScreen({ communityId, setActiveTab, router }: HighlightScreenProps) {
  const { t } = useTranslation('highlight');
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
                onPress={() =>
                  router.push(`/(community)/${communityId}/notices` as never)
                }
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
            onSeeMore={() => setActiveTab('artist')}
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
            onSeeMore={() => setActiveTab('fan')}
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
            onSeeMore={() => setActiveTab('artist')}
          />
          <HorizontalCardScroll
            data={data!.artistMembers}
            keyExtractor={(member) => member.id}
            renderItem={(member) => (
              <ArtistMemberCard
                member={member}
                onPress={() => setActiveTab('artist')}
              />
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

export default function CommunityMainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('fan');
  const { setActiveCommunity } = useCommunityStore();
  const { show: showLeaveDialog } = useLeaveConfirmDialog();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async (): Promise<Community | null> => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, cover_image_url, type')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Community;
    },
    enabled: !!id,
  });

  const { data: membership } = useCommunityMember(id ?? '');
  const leaveMutation = useLeaveCommunity();

  useEffect(() => {
    if (community) {
      setActiveCommunity(community.id, community.type);
    }
  }, [community, setActiveCommunity]);

  const handleLeave = () => {
    if (!membership || !id) return;
    showLeaveDialog(() => {
      leaveMutation.mutate({
        membershipId: membership.id,
        communityId: id,
      });
    });
  };

  if (isLoading || !community) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fan':
        return <FanTab />;
      case 'artist':
        return <ArtistTab />;
      case 'highlight':
        return (
          <HighlightScreen
            communityId={id ?? ''}
            setActiveTab={setActiveTab}
            router={router}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header: cover image with community name overlay */}
      <View className="relative">
        <Image
          source={{ uri: community.cover_image_url ?? undefined }}
          style={{ width: '100%', height: 192 }}
          contentFit="cover"
          transition={200}
        />
        {/* Overlay */}
        <View className="absolute inset-0 bg-black/40" />
        {/* Header actions */}
        <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push(`/(community)/${id}/settings/nickname` as never)}
              accessibilityRole="button"
              accessibilityLabel="닉네임 설정"
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleLeave}
              accessibilityRole="button"
              accessibilityLabel="커뮤니티 탈퇴"
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        {/* Community name */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <Text className="text-display font-semibold text-white">{community.name}</Text>
        </View>
      </View>

      {/* Tab bar */}
      <CommunityTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <View className="flex-1">{renderTabContent()}</View>
    </SafeAreaView>
  );
}
