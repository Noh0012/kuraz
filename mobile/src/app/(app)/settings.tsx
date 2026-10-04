import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { ScreenHeader } from '@/components/Headers';
import { Text } from '@/components/Text';
import { useMe } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, gutter, radius } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { data: me } = useMe();

  const rows: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; detail?: string; href?: Href; onPress?: () => void }[] = [
    { icon: 'person-outline', label: 'Profile', detail: me?.email ?? undefined, href: '/profile' },
    { icon: 'school-outline', label: 'Grade', detail: me?.grade?.name, href: '/grade-select' },
    { icon: 'sparkles-outline', label: 'Plans & subscription', detail: me?.plan ? `${me.plan.name}` : 'Free Plan', href: '/plans' },
    { icon: 'bookmark-outline', label: 'Bookmarks', href: '/bookmarks' },
    { icon: 'help-buoy-outline', label: 'Contact us', href: '/contact' },
  ];

  function signOut() {
    Alert.alert('Sign out?', 'You can sign back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 16 }}>
        <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <Pressable
              key={r.label}
              accessibilityRole="button"
              onPress={() => (r.href ? router.push(r.href) : r.onPress?.())}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.divider,
                backgroundColor: pressed ? colors.bg : colors.white,
              })}
            >
              <Ionicons name={r.icon} size={22} color={colors.textSoft} />
              <Text weight="medium" style={{ flex: 1, fontSize: 16 }}>
                {r.label}
              </Text>
              {r.detail && (
                <Text style={{ color: colors.textMuted, maxWidth: 160 }} numberOfLines={1}>
                  {r.detail}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: 16,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text weight="semibold" style={{ color: colors.danger, fontSize: 16 }}>
            Sign out
          </Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 8 }}>Kuraz v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </View>
  );
}
