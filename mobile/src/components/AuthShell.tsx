import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoLockup } from '@/brand/Logo';
import { colors, gradients, gutter } from '@/theme/tokens';
import { Text } from './Text';

/** Shared layout for sign-in / sign-up: brand gradient header with a white sheet below. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={gradients.splash} style={{ paddingTop: insets.top + 36, paddingBottom: 56, paddingHorizontal: gutter }}>
          <LogoLockup size={46} />
          <Text weight="bold" style={{ color: colors.white, fontSize: 28, marginTop: 28 }}>
            {title}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, marginTop: 6, lineHeight: 22 }}>{subtitle}</Text>
        </LinearGradient>
        <View
          style={{
            flex: 1,
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: colors.white,
            paddingHorizontal: gutter,
            paddingTop: 28,
            paddingBottom: insets.bottom + 24,
            gap: 18,
          }}
        >
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
