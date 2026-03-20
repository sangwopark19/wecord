import { View, Text } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

interface TranslatedTextBlockProps {
  translatedText: string;
}

export function TranslatedTextBlock({ translatedText }: TranslatedTextBlockProps) {
  const { t } = useTranslation('translation');

  return (
    <View className="border-t border-border mt-2 pt-2">
      <Text className="text-body font-regular text-foreground" style={{ lineHeight: 21 }}>
        {translatedText}
      </Text>
      <Text className="text-label text-muted-foreground mt-1">
        {t('credit')}
      </Text>
    </View>
  );
}
