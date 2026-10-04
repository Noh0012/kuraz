import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/Headers';
import { Explanation, OptionRow } from '@/components/QuestionView';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { percent } from '@/lib/format';
import { useAttemptResult } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

type Filter = 'all' | 'wrong' | 'skipped';

function ScoreRing({ value }: { value: number }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? colors.success : value >= 50 ? colors.primary : colors.orange;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.divider} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - value / 100)}
          strokeLinecap="round"
        />
      </Svg>
      <Text weight="extrabold" style={{ fontSize: 32 }}>
        {value}%
      </Text>
    </View>
  );
}

export default function AttemptResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const result = useAttemptResult(id);
  const [filter, setFilter] = useState<Filter>('all');

  if (result.isPending || result.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Result" />
        {result.isPending ? <LoadingState /> : <ErrorState error={result.error} onRetry={() => result.refetch()} />}
      </View>
    );
  }

  const r = result.data;
  const wrong = r.review.filter((x) => x.selected_option && !x.is_correct).length;
  const skipped = r.review.filter((x) => !x.selected_option).length;
  const minutes = Math.max(1, Math.round((Date.parse(r.submitted_at) - Date.parse(r.started_at)) / 60000));
  const items = r.review
    .map((item, i) => ({ item, n: i + 1 }))
    .filter(({ item }) => (filter === 'wrong' ? item.selected_option && !item.is_correct : filter === 'skipped' ? !item.selected_option : true));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Result" />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 40 }}>
        <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
          <Text weight="semibold" style={{ color: colors.textSoft, textAlign: 'center' }}>
            {r.test.title}
          </Text>
          <ScoreRing value={percent(r.score, r.total)} />
          <Text weight="bold" style={{ fontSize: 18 }}>
            {r.score} of {r.total} correct
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat label="Correct" value={r.score} color={colors.success} />
            <Stat label="Wrong" value={wrong} color={colors.danger} />
            <Stat label="Skipped" value={skipped} color={colors.textMuted} />
            <Stat label="Minutes" value={minutes} color={colors.primary} />
          </View>
          {r.late && (
            <Text style={{ color: colors.warning, textAlign: 'center' }}>Time ran out, so answers saved before the deadline were marked.</Text>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['all', 'wrong', 'skipped'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === f }}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === f ? colors.ink : colors.white,
                borderWidth: 1,
                borderColor: filter === f ? colors.ink : colors.border,
              }}
            >
              <Text weight="semibold" style={{ color: filter === f ? colors.white : colors.textSoft, textTransform: 'capitalize' }}>
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {items.map(({ item, n }) => (
          <Card key={item.question_id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name={item.is_correct ? 'checkmark-circle' : item.selected_option ? 'close-circle' : 'remove-circle'}
                size={22}
                color={item.is_correct ? colors.success : item.selected_option ? colors.danger : colors.textMuted}
              />
              <Text weight="semibold" style={{ color: colors.label }}>
                QUESTION {n}
              </Text>
            </View>
            <Text weight="medium" style={{ fontSize: 16, lineHeight: 24 }}>
              {item.stem}
            </Text>
            <View style={{ gap: 8 }}>
              {item.options.map((o) => (
                <OptionRow
                  key={o.key}
                  option={o}
                  disabled
                  state={o.key === item.correct_option ? 'correct' : o.key === item.selected_option ? 'wrong' : 'dim'}
                />
              ))}
            </View>
            <Explanation reveal={{ is_correct: item.is_correct, correct_option: item.correct_option, explanation: item.explanation }} />
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 64, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.bg }}>
      <Text weight="bold" style={{ fontSize: 18, color }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
