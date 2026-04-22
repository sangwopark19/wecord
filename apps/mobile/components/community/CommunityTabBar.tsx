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
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: '#8B5CF6' } : undefined}
          >
            <Text
              style={{
                fontFamily: isActive ? 'Pretendard-Bold' : 'Pretendard',
                fontSize: 15,
                color: isActive ? '#FFFFFF' : 'rgba(235,235,245,0.38)',
              }}
            >
              {t(`tabs.${tab}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
