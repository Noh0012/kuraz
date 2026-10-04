import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FLAME_INNER, FLAME_OUTER, LAMP_BODY, LAMP_NECK } from '@/brand/Logo';
import { UserAvatar } from '@/components/Avatar';
import { AppHeader } from '@/components/Headers';
import { Text } from '@/components/Text';
import { useMe } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

const ACTIONS: { label: string; icon: ComponentProps<typeof Ionicons>['name']; color: string; bg: string; href: Href }[] = [
  { label: 'View plans', icon: 'sparkles', color: '#F5A524', bg: '#FFF4DE', href: '/plans' },
  { label: 'Contact Us', icon: 'headset', color: '#1FA971', bg: '#E2F7EE', href: '/contact' },
  { label: 'Report an issue', icon: 'bug', color: '#E5484D', bg: '#FDE7E8', href: '/report-issue' },
  { label: 'Settings', icon: 'settings', color: '#7D8597', bg: '#F0F2F6', href: '/settings' },
  { label: 'Bookmarks', icon: 'bookmark', color: colors.primary, bg: colors.primarySoft, href: '/bookmarks' },
  { label: 'Profile', icon: 'person', color: '#7C5CFC', bg: '#EFEAFE', href: '/profile' },
];

export default function MeTab() {
  const router = useRouter();
  const { data: me } = useMe();
  const incomplete = !!me && (!me.phone || !me.school);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader
        leading={
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="school-outline" size={28} color={colors.text} />
          </View>
        }
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')}>
            <UserAvatar url={me?.avatar_url} size={54} warn={incomplete} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ backgroundColor: colors.white, paddingHorizontal: gutter, paddingTop: 28, paddingBottom: 12 }}>
          <Text weight="semibold" style={{ fontSize: 26 }} numberOfLines={2}>
            Hi, {me?.full_name || 'there'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 24 }}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                onPress={() => router.push(a.href)}
                style={({ pressed }) => ({ width: '33.33%', alignItems: 'center', gap: 12, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: a.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={a.icon} size={28} color={a.color} />
                </View>
                <Text weight="medium" style={{ fontSize: 15, textAlign: 'center' }}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flex: 1, minHeight: 180, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.55 }}>
            <Text weight="extrabold" style={{ fontSize: 40, color: '#C9D1DD', letterSpacing: 1 }}>
              KEEP THE
            </Text>
            <Svg width={44} height={44} viewBox="0 0 100 100">
              <Path d={FLAME_OUTER} fill="#C9D1DD" />
              <Path d={FLAME_INNER} fill="#E3E8EF" />
              <Path d={LAMP_NECK} fill="#C9D1DD" />
              <Path d={LAMP_BODY} fill="#C9D1DD" />
            </Svg>
            <Text weight="extrabold" style={{ fontSize: 40, color: '#C9D1DD', letterSpacing: 1 }}>
              LIT
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
