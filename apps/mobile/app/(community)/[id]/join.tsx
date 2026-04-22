import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../../lib/supabase';
import { useJoinCommunity, generateNickname } from '../../../hooks/community/useJoinCommunity';
import { CommunityNicknameInput } from '../../../components/community/CommunityNicknameInput';
import { PrimaryCTAButton } from '../../../components/PrimaryCTAButton';

export default function JoinCommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('community');
  const [nickname, setNickname] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);

  const { data: community } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    async function loadNickname() {
      setIsGenerating(true);
      try {
        const generated = await generateNickname();
        setNickname(generated);
      } catch {
        // Edge Function may not exist or network error — fallback locally
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setNickname(`User#${randomNum}`);
      } finally {
        setIsGenerating(false);
      }
    }
    void loadNickname();
  }, []);

  const joinMutation = useJoinCommunity();

  const handleJoin = async () => {
    if (!id || !nickname.trim()) return;
    try {
      await joinMutation.mutateAsync({
        communityId: id,
        nickname: nickname.trim(),
      });
      router.replace(`/(community)/${id}` as never);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[handleJoin] join error:', { code: error?.code, message: error?.message, err });
      if (error?.code === '23505') {
        // Nickname collision — inform user and regenerate
        Alert.alert('닉네임 중복', '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
        const newNickname = await generateNickname();
        setNickname(newNickname);
      } else {
        Alert.alert('오류', '가입 중 문제가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  if (isGenerating) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 pt-8">
        {community ? (
          <Text className="text-display font-semibold text-foreground mb-2">{community.name}</Text>
        ) : null}

        <Text className="text-body text-muted-foreground mb-6">
          {t('nickname.edit')}
        </Text>

        <CommunityNicknameInput value={nickname} onChangeText={setNickname} />
      </View>

      <View className="pb-6">
        <PrimaryCTAButton
          label={t('join.confirmNickname')}
          onPress={() => void handleJoin()}
          loading={joinMutation.isPending}
          disabled={!nickname.trim() || joinMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}
