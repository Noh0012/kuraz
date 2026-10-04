import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/Headers';
import { Text } from '@/components/Text';
import { SUPPORT } from '@/lib/config';
import { colors, gutter, radius } from '@/theme/tokens';

export default function ContactScreen() {
  const router = useRouter();
  const channels = [
    { icon: 'mail-outline' as const, label: 'Email', value: SUPPORT.email, url: `mailto:${SUPPORT.email}` },
    ...(SUPPORT.phone ? [{ icon: 'call-outline' as const, label: 'Phone', value: SUPPORT.phone, url: `tel:${SUPPORT.phone.replace(/\s/g, '')}` }] : []),
    ...(SUPPORT.telegram ? [{ icon: 'paper-plane-outline' as const, label: 'Telegram', value: SUPPORT.telegram, url: SUPPORT.telegram }] : []),
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Contact Us" />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E2F7EE', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="headset" size={38} color="#1FA971" />
          </View>
          <Text weight="bold" style={{ fontSize: 22 }}>
            We are here to help
          </Text>
          <Text style={{ color: colors.textSoft, textAlign: 'center' }}>{SUPPORT.hours}</Text>
        </View>
        <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' }}>
          {channels.map((c, i) => (
            <Pressable
              key={c.label}
              accessibilityRole="link"
              onPress={() => Linking.openURL(c.url)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.divider,
                backgroundColor: pressed ? colors.bg : colors.white,
              })}
            >
              <Ionicons name={c.icon} size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{c.label}</Text>
                <Text weight="medium" style={{ fontSize: 16 }}>
                  {c.value}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
        <Button title="Report an issue in the app" variant="outline" icon="bug-outline" onPress={() => router.push('/report-issue')} />
      </ScrollView>
    </View>
  );
}
