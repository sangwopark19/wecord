import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton';

const TOS_CONTENT = `서비스 이용약관

제1조 (목적)
이 약관은 Wecord (이하 "서비스")의 이용에 관한 조건 및 절차, 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
"이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.

제3조 (약관의 효력)
본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.

개인정보처리방침

Wecord는 이용자의 개인정보를 소중히 여기며, 개인정보보호법에 따라 개인정보를 처리합니다. 수집하는 정보: 이메일, 프로필 정보, 활동 내역. 보유 기간: 회원 탈퇴 시까지. 제3자 제공: 법령에 따른 경우를 제외하고 제공하지 않습니다.`;

export default function TosScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    router.push('/(onboarding)/dob');
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <Text className="text-heading font-semibold text-foreground mt-6">
          {t('tos.title')}
        </Text>

        <ScrollView
          className="bg-card rounded-xl p-4 mt-4 max-h-60"
          showsVerticalScrollIndicator
        >
          <Text className="text-body font-regular text-foreground">
            {TOS_CONTENT}
          </Text>
        </ScrollView>

        <Pressable
          onPress={() => setAccepted((prev) => !prev)}
          className="flex-row items-center mt-4 gap-3"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
        >
          <View
            className={`w-5 h-5 rounded items-center justify-center ${
              accepted ? 'bg-teal' : 'bg-input'
            }`}
          >
            {accepted && (
              <Text className="text-[#000000] text-label font-semibold">✓</Text>
            )}
          </View>
          <Text className="text-body font-regular text-foreground flex-1">
            {t('tos.accept_label')}
          </Text>
        </Pressable>
      </View>

      <View className="pb-6">
        <PrimaryCTAButton
          label={t('tos.cta')}
          onPress={handleContinue}
          disabled={!accepted}
        />
      </View>
    </SafeAreaView>
  );
}
