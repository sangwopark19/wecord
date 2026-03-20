import { useRef, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useArtistMembers, ArtistMember } from '../../hooks/community/useArtistMembers';
import { useFollowMember } from '../../hooks/community/useFollowMember';
import { useCommunityMember } from '../../hooks/community/useCommunityMember';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface ArtistMemberScrollProps {
  communityId: string;
  selectedMemberId: string | null;
  onSelect: (id: string | null) => void;
}

function useFollowedMemberIds(communityId: string, myCmId: string | null, memberUserIds: string[]) {
  return useQuery({
    queryKey: ['followedMembers', communityId, myCmId],
    queryFn: async (): Promise<Set<string>> => {
      if (!myCmId || memberUserIds.length === 0) return new Set();

      // Fetch community_members for artist member user_ids to get their cm_ids
      const { data: memberCmData } = await supabase
        .from('community_members')
        .select('id, user_id')
        .eq('community_id', communityId)
        .in('user_id', memberUserIds);

      if (!memberCmData || memberCmData.length === 0) return new Set();

      const memberCmIds = memberCmData.map((m) => m.id);

      // Fetch which of these cm_ids we follow
      const { data: followData } = await supabase
        .from('community_follows')
        .select('following_cm_id')
        .eq('follower_cm_id', myCmId)
        .in('following_cm_id', memberCmIds);

      if (!followData) return new Set();
      return new Set(followData.map((f) => f.following_cm_id));
    },
    enabled: !!myCmId && memberUserIds.length > 0,
  });
}

export function ArtistMemberScroll({
  communityId,
  selectedMemberId,
  onSelect,
}: ArtistMemberScrollProps) {
  const { data: members = [] } = useArtistMembers(communityId);
  const { data: myMembership } = useCommunityMember(communityId);
  const followMember = useFollowMember();

  const memberUserIds = members
    .map((m) => m.user_id)
    .filter((uid): uid is string => uid !== null);

  const { data: followedCmIds = new Set<string>() } = useFollowedMemberIds(
    communityId,
    myMembership?.id ?? null,
    memberUserIds
  );

  const handleLongPress = (member: ArtistMember) => {
    if (!myMembership) return;

    // We need to know the member's cm_id for follow operations
    // For simplicity, use the member's user_id to find their cm_id
    // The follow state is tracked via followedCmIds Set
    Alert.alert(
      member.display_name,
      undefined,
      [
        {
          text: '팔로우',
          onPress: () => {
            if (!member.user_id) return;
            // We'll trigger a follow by member id lookup
            // Since we batch-load cm_ids, we skip for members without user_id
            Alert.alert('', '팔로우 기능은 준비 중이에요.');
          },
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  const handleLongPressWithCmId = async (member: ArtistMember) => {
    if (!myMembership || !member.user_id) {
      Alert.alert('', '팔로우할 수 없는 멤버예요.');
      return;
    }

    // Fetch the member's community_member id
    const { data: cmData } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', member.user_id)
      .single();

    if (!cmData) {
      Alert.alert('', '멤버 정보를 찾을 수 없어요.');
      return;
    }

    const memberCmId = cmData.id as string;
    const isFollowing = followedCmIds.has(memberCmId);

    Alert.alert(
      member.display_name,
      undefined,
      [
        {
          text: isFollowing ? '팔로우 취소' : '팔로우',
          onPress: () => {
            followMember.mutate({
              followerCmId: myMembership.id,
              followingCmId: memberCmId,
              isFollowing,
              communityId,
            });
          },
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  const renderAllButton = () => (
    <Pressable
      key="all"
      onPress={() => onSelect(null)}
      className="items-center mr-3"
      accessibilityRole="button"
      accessibilityLabel="전체"
    >
      <View
        className={`w-14 h-14 rounded-full bg-card items-center justify-center ${
          selectedMemberId === null ? 'border-2 border-teal' : ''
        }`}
        style={{ width: 56, height: 56 }}
      >
        <Ionicons
          name="grid-outline"
          size={24}
          color={selectedMemberId === null ? '#00E5C3' : '#999999'}
        />
      </View>
      <Text
        className={`text-label font-regular mt-1 ${
          selectedMemberId === null ? 'text-foreground' : 'text-muted-foreground'
        }`}
        numberOfLines={1}
        style={{ maxWidth: 56 }}
      >
        전체
      </Text>
    </Pressable>
  );

  const renderMemberItem = ({ item }: { item: ArtistMember }) => {
    const isSelected = selectedMemberId === item.id;

    return (
      <Pressable
        onPress={() => onSelect(item.id)}
        onLongPress={() => handleLongPressWithCmId(item)}
        className="items-center mr-3"
        accessibilityRole="button"
        accessibilityLabel={item.display_name}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            overflow: 'hidden',
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? '#00E5C3' : 'transparent',
          }}
          className="bg-card"
        >
          {item.profile_image_url ? (
            <Image
              source={{ uri: item.profile_image_url }}
              style={{ width: 56, height: 56 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{ width: 56, height: 56 }}
              className="bg-card items-center justify-center"
            >
              <Ionicons name="person-outline" size={24} color="#999999" />
            </View>
          )}
        </View>
        <Text
          className={`text-label font-regular mt-1 ${
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          }`}
          numberOfLines={1}
          style={{ maxWidth: 56 }}
        >
          {item.display_name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="py-3">
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListHeaderComponent={renderAllButton}
      />
    </View>
  );
}
