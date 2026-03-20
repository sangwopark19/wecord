import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useCommunityMember } from '../../../hooks/community/useCommunityMember';
import { CommunityPreviewSheet } from '../../../components/community/CommunityPreviewSheet';

interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  type: 'solo' | 'group';
  category: string | null;
  member_count: number;
}

export default function CommunityPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async (): Promise<Community | null> => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, cover_image_url, type, category, member_count')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Community;
    },
    enabled: !!id,
  });

  const { data: membership } = useCommunityMember(id ?? '');

  if (isLoading || !community) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <CommunityPreviewSheet
        community={community}
        isMember={!!membership}
        onJoinPress={() => router.push(`/(community)/${id}/join` as never)}
        onEnterPress={() => router.replace(`/(community)/${id}` as never)}
      />
    </SafeAreaView>
  );
}
