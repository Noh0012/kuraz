import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { EmptyState } from '@/components/States';
import { colors } from '@/theme/tokens';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
      <EmptyState icon="compass-outline" title="Page not found" message="This screen does not exist." action={{ title: 'Go home', onPress: () => router.replace('/') }} />
    </View>
  );
}
