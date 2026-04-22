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
import { LinearGradient } from 'expo-linear-gradient';
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
import { NotificationBellBadge } from '../../../components/notification/NotificationBellBadge';
import { usePushTokenRegistration } from '../../../hooks/notification/usePushTokenRegistration';
import FanTab from './fan';
import ArtistTab from './artist';

type TabKey = 'fan' | 'artist' | 'highlight';

interface Community {
  id: string;
  name: string;
  cover_image_url: string | null;
  type: 'solo' | 'group';
  member_count: number;
}

const SOCIAL_LINKS: ReadonlyArray<string> = ['Website', 'YouTube', 'Instagram', 'X', 'TikTok'];

function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

// Pill icon button over hero cover
function HeroIconButton({
  icon,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={20} color="#FFFFFF" />
    </Pressable>
  );
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
          <Text style={{ color: '#8B5CF6' }} className="text-body">
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
          tintColor="#8B5CF6"
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

  // Register push token on community entry
  usePushTokenRegistration();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async (): Promise<Community | null> => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, cover_image_url, type, member_count')
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
      {/* Hero — 420px dramatic cover (Variation A) */}
      <View style={{ height: 420, overflow: 'hidden' }}>
        <Image
          source={{ uri: community.cover_image_url ?? undefined }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
        {/* Feathered gradient overlay: top veil + deep bottom vignette */}
        <LinearGradient
          colors={[
            'rgba(11,11,15,0.25)',
            'rgba(11,11,15,0.00)',
            'rgba(11,11,15,0.00)',
            'rgba(11,11,15,0.92)',
          ]}
          locations={[0, 0.18, 0.35, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Header actions — pill icon buttons */}
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-3"
          style={{ top: 8 }}
        >
          <HeroIconButton icon="arrow-back" onPress={() => router.back()} label="뒤로가기" />
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <NotificationBellBadge
              communityId={id!}
              onPress={() => router.push(`/(community)/${id}/notifications` as never)}
            />
            <HeroIconButton
              icon="settings-outline"
              onPress={() => router.push(`/(community)/${id}/settings/nickname` as never)}
              label="닉네임 설정"
            />
            <HeroIconButton
              icon="ellipsis-horizontal"
              onPress={handleLeave}
              label="커뮤니티 탈퇴"
            />
          </View>
        </View>
        {/* Community meta — label + hero name + social pills */}
        <View className="absolute left-0 right-0 px-4" style={{ bottom: 72 }}>
          <Text
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 11,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 8,
            }}
          >
            COMMUNITY · {formatMemberCount(community.member_count ?? 0)}
          </Text>
          <Text
            style={{
              fontFamily: 'Pretendard-Black',
              fontSize: 44,
              lineHeight: 44,
              letterSpacing: -1.5,
              color: '#FFFFFF',
            }}
            numberOfLines={1}
          >
            {community.name}
          </Text>
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {SOCIAL_LINKS.map((label) => (
              <View
                key={label}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 11,
                  }}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <CommunityTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <View className="flex-1">{renderTabContent()}</View>
    </SafeAreaView>
  );
}
