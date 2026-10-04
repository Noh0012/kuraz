import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { TestCard } from '@/types/contracts';
import { formatDay } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { Card } from './Card';
import { Chip } from './SectionLabel';
import { Text } from './Text';

const ICON: Record<TestCard['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  national: 'school',
  mock: 'clipboard-text-clock',
  unit: 'book-check',
};

/** Test card from the reference: round emblem, title, lock + "N ques • M min". */
export function TestCardRow({ test }: { test: TestCard }) {
  const router = useRouter();
  return (
    <Card
      onPress={() => router.push(`/tests/${test.id}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 18 }}
      accessibilityLabel={`${test.title}, ${test.question_count} questions, ${test.duration_minutes} minutes${test.locked ? ', locked' : ''}`}
    >
      <LinearGradient
        colors={['#2F63E0', '#1C3FB8']}
        style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#4C7DF0' }}
      >
        <MaterialCommunityIcons name={ICON[test.type]} size={36} color={colors.white} />
      </LinearGradient>
      <View style={{ flex: 1, gap: 8 }}>
        <Text weight="semibold" style={{ fontSize: 18 }} numberOfLines={2}>
          {test.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {test.locked && (
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
            </View>
          )}
          <Text style={{ color: colors.textSoft, fontSize: 15 }}>
            {test.question_count} ques • {test.duration_minutes} min
          </Text>
        </View>
        {(test.opens_on || test.best || test.open_attempt_id || test.is_free) && (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {test.opens_on && <Chip label={`Opens ${formatDay(test.opens_on)}`} tone="grey" />}
            {test.open_attempt_id && <Chip label="In progress" tone="orange" />}
            {test.best && <Chip label={`Best ${test.best.score}/${test.best.total}`} tone="green" />}
            {test.is_free && !test.best && !test.open_attempt_id && <Chip label="Free" />}
          </View>
        )}
      </View>
    </Card>
  );
}
