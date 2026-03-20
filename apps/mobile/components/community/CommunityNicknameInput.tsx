import { View, TextInput, Text } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

interface CommunityNicknameInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function CommunityNicknameInput({ value, onChangeText }: CommunityNicknameInputProps) {
  const { t } = useTranslation('community');

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={24}
        className="bg-input text-foreground rounded-xl px-4 h-[52px] text-body"
        placeholderTextColor="#666666"
        autoCorrect={false}
        autoCapitalize="none"
      />
      <Text className="text-label text-muted-foreground text-right mt-1 pr-1">
        {t('nickname.charLimit', { current: value.length })}
      </Text>
    </View>
  );
}
