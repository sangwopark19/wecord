import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@wecord/shared/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase';
import { useCommunityMember } from '../../../../hooks/community/useCommunityMember';
import { CommunityNicknameInput } from '../../../../components/community/CommunityNicknameInput';
import { PrimaryCTAButton } from '../../../../components/PrimaryCTAButton';

export default function NicknameSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('community');
  const queryClient = useQueryClient();

  const { data: membership } = useCommunityMember(id ?? '');
  const [nickname, setNickname] = useState(membership?.community_nickname ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync nickname when membership loads
  if (membership && !nickname && membership.community_nickname) {
    setNickname(membership.community_nickname);
  }

  const handleSave = async () => {
    if (!membership || !nickname.trim() || !id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ community_nickname: nickname.trim() })
        .eq('id', membership.id);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('닉네임 중복', '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
          return;
        }
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['communityMember', id] });
      router.back();
    } catch {
      Alert.alert('오류', '닉네임 저장 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 pt-8">
        <Text className="text-display font-semibold text-foreground mb-6">
          {t('nickname.edit')}
        </Text>
        <CommunityNicknameInput
          value={nickname}
          onChangeText={setNickname}
        />
      </View>

      <View className="pb-6">
        <PrimaryCTAButton
          label={t('nickname.save')}
          onPress={() => void handleSave()}
          loading={isSaving}
          disabled={!nickname.trim() || isSaving || nickname === membership?.community_nickname}
        />
      </View>
    </SafeAreaView>
  );
}
