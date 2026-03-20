import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';

interface TranslateButtonProps {
  isTranslated: boolean;
  isLoading: boolean;
  error: string | null;
  onPress: () => void;
}

export function TranslateButton({ isTranslated, isLoading, error, onPress }: TranslateButtonProps) {
  const { t } = useTranslation('translation');

  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        style={{ minHeight: 44 }}
        className="flex-row items-center py-2"
        accessibilityRole="button"
        accessibilityLabel={isTranslated ? t('showOriginal') : t('translate')}
      >
        {isLoading ? (
          <ActivityIndicator size={16} color="#00E5C3" />
        ) : (
          <Ionicons name="language-outline" size={14} color="#00E5C3" />
        )}
        <Text className="text-label font-regular ml-1" style={{ color: '#00E5C3' }}>
          {isLoading ? t('loading') : isTranslated ? t('showOriginal') : t('translate')}
        </Text>
      </Pressable>
      {error && (
        <Text className="text-label" style={{ color: '#FF4444' }}>
          {t('error')}
        </Text>
      )}
    </View>
  );
}
