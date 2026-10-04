import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '@/lib/queries';
import { colors } from '@/theme/tokens';
import { UserAvatar } from './Avatar';
import { Text } from './Text';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TABS: Record<string, { label: string; icon: IconName; active: IconName }> = {
  index: { label: 'HOME', icon: 'home-outline', active: 'home' },
  videos: { label: 'VIDEOS', icon: 'play-box-outline', active: 'play-box' },
  qbank: { label: 'QBANK', icon: 'notebook-edit-outline', active: 'notebook-edit' },
  tests: { label: 'TESTS', icon: 'file-document-outline', active: 'file-document' },
  me: { label: 'ME', icon: 'account-circle-outline', active: 'account-circle' },
};

/** Bottom bar from the reference: outline icons, filled + dark when active, with a bar above the active tab. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.ink : '#8C91AA';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={{ flex: 1, alignItems: 'center', paddingTop: 10, gap: 4 }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                height: 3,
                width: '70%',
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                backgroundColor: focused ? colors.ink : 'transparent',
              }}
            />
            {route.name === 'me' ? (
              <View style={{ opacity: focused ? 1 : 0.85 }}>
                <UserAvatar url={me?.avatar_url} size={30} />
              </View>
            ) : (
              <MaterialCommunityIcons name={focused ? tab.active : tab.icon} size={29} color={color} />
            )}
            <Text weight={focused ? 'bold' : 'semibold'} style={{ fontSize: 12, color, letterSpacing: 0.3 }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
