import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
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
import { HighlightPlaceholder } from '../../../components/community/HighlightPlaceholder';
import { useLeaveConfirmDialog } from '../../../components/community/LeaveConfirmDialog';

type TabKey = 'fan' | 'artist' | 'highlight';

interface Community {
  id: string;
  name: string;
  cover_image_url: string | null;
  type: 'solo' | 'group';
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
        return (
          <View className="flex-1 items-center justify-center">
            <Text className="text-body text-muted-foreground">Feed coming in Plan 03-02</Text>
          </View>
        );
      case 'artist':
        return (
          <View className="flex-1 items-center justify-center">
            <Text className="text-body text-muted-foreground">Feed coming in Plan 03-02</Text>
          </View>
        );
      case 'highlight':
        return <HighlightPlaceholder />;
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
