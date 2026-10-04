import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="grade-select" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      {/* A running test must be left through its own confirm dialog. */}
      <Stack.Screen name="attempt/[id]/index" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
