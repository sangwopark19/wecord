import { View, Text, FlatList, Pressable } from 'react-native';

type SupportedLanguage = 'ko' | 'en' | 'th' | 'zh' | 'ja';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

interface Props {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  /**
   * onboarding: parent commits on a downstream CTA.
   * settings: onChange is the commit boundary; parent persists immediately.
   * (No branching inside the component itself — the prop documents intent.)
   */
  mode: 'onboarding' | 'settings';
}

export function LanguagePicker({ value, onChange }: Props) {
  return (
    <FlatList
      data={LANGUAGES}
      keyExtractor={(item) => item.code}
      className="mt-4"
      ItemSeparatorComponent={() => <View className="h-2" />}
      renderItem={({ item }) => {
        const isSelected = item.code === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={item.label}
            onPress={() => onChange(item.code)}
            className={`flex-row items-center justify-between h-[52px] rounded-xl px-4 bg-card ${
              isSelected ? 'border-2 border-teal' : 'border-2 border-transparent'
            }`}
          >
            <Text className="text-body font-regular text-foreground">{item.label}</Text>
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                isSelected ? 'border-teal' : 'border-subtle'
              }`}
            >
              {isSelected && <View className="w-[10px] h-[10px] rounded-full bg-teal" />}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

export type { SupportedLanguage };
export { LANGUAGES };
