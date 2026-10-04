import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoTile } from '@/brand/Logo';
import { useMe } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';
import { Text } from './Text';

/** Home/Me header: brand tile, "Grade 12 ⌄" switcher with the plan underneath, and a right slot. */
export function AppHeader({ right, leading }: { right?: ReactNode; leading?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: me } = useMe();
  const planLabel = me?.plan ? `${me.plan.name} Plan` : 'Free Plan';
  return (
    <View
      style={{
        paddingTop: insets.top + 14,
        paddingBottom: 16,
        paddingHorizontal: gutter,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {leading ?? <LogoTile size={54} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change grade, current ${me?.grade?.name ?? 'none'}`}
        onPress={() => router.push('/grade-select')}
        style={{ flex: 1 }}
        hitSlop={8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text weight="semibold" style={{ fontSize: 23, color: colors.text }} numberOfLines={1}>
            {me?.grade?.name ?? 'Choose grade'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </View>
        <Text style={{ fontSize: 15, color: colors.textMuted, marginTop: 2 }}>{planLabel}</Text>
      </Pressable>
      {right}
    </View>
  );
}

/** Pushed-screen header: back arrow + title ("‹ Profile"). */
export function ScreenHeader({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 12,
        paddingHorizontal: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        hitSlop={10}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <Text weight="semibold" style={{ fontSize: 20, flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Tappable search field that opens the search screen. */
export function SearchBar({ right, scope }: { right?: ReactNode; scope?: 'videos' | 'qbank' | 'tests' }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 12,
        paddingHorizontal: gutter,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search for videos, QBank and more"
        onPress={() => router.push(scope ? { pathname: '/search', params: { scope } } : '/search')}
        style={{
          flex: 1,
          height: 50,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: '#FAFBFD',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        <Ionicons name="search-outline" size={22} color={colors.textSoft} />
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>Search for Videos, QBank & more</Text>
      </Pressable>
      {right}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.text,
  bordered = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  label: string;
  color?: string;
  bordered?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: bordered ? 52 : 40,
        height: bordered ? 52 : 40,
        borderRadius: 26,
        borderWidth: bordered ? 1 : 0,
        borderColor: colors.border,
        backgroundColor: bordered ? colors.white : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={bordered ? 24 : 24} color={color} />
    </Pressable>
  );
}
