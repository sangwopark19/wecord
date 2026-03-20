import { View, Pressable, Text } from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';

type TabKey = 'fan' | 'artist' | 'highlight';

interface CommunityTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TABS: TabKey[] = ['fan', 'artist', 'highlight'];

export function CommunityTabBar({ activeTab, onTabChange }: CommunityTabBarProps) {
  const { t } = useTranslation('community');

  return (
    <View className="flex-row bg-background border-b border-border">
      {TABS.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className="flex-1 items-center py-3"
            accessibilityRole="button"
            accessibilityLabel={t(`tabs.${tab}`)}
            accessibilityState={{ selected: isActive }}
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: '#00E5C3' } : undefined}
          >
            <Text
              className={isActive ? 'text-body font-semibold text-foreground' : 'text-body text-subtle'}
            >
              {t(`tabs.${tab}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
