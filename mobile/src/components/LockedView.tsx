import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { colors } from '@/theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

/** Shown when the API answers 403 "locked" for paid content. */
export function LockedView({ what = 'This lesson' }: { what?: string }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="lock-closed" size={38} color={colors.orange} />
      </View>
      <Text weight="bold" style={{ fontSize: 20, textAlign: 'center' }}>
        {what} is locked
      </Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
        It is part of a paid package for your grade. Upgrade to unlock every lesson, question and test.
      </Text>
      <Button title="See plans" variant="orange" icon="sparkles" onPress={() => router.push('/plans')} style={{ marginTop: 8, alignSelf: 'stretch' }} />
    </View>
  );
}
