import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/Headers';
import { ProgressBar } from '@/components/ProgressBar';
import { Chip } from '@/components/SectionLabel';
import { ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { Text } from '@/components/Text';
import { percent } from '@/lib/format';
import { useSubjectQbank } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

export default function SubjectQbankScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useSubjectQbank(id);

  const totals = q.data?.chapters.reduce(
    (acc, c) => ({ total: acc.total + c.total, answered: acc.answered + c.answered, correct: acc.correct + c.correct }),
    { total: 0, answered: 0, correct: 0 },
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={q.data ? `${q.data.subject.name} QBank` : 'QBank'} />
      {q.isPending ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: gutter, gap: 14, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} colors={[colors.primary]} />}
        >
          {totals && (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <SubjectIcon icon={q.data.subject.icon} color={q.data.subject.color} size={60} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text weight="semibold" style={{ fontSize: 16 }}>
                  {totals.answered}/{totals.total} questions done
                </Text>
                <ProgressBar value={totals.total ? totals.answered / totals.total : 0} color={q.data.subject.color} height={6} />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Accuracy {percent(totals.correct, totals.answered)}%
                </Text>
              </View>
            </Card>
          )}
          <Text weight="semibold" style={{ fontSize: 15, color: colors.label, letterSpacing: 0.6, marginTop: 10 }}>
            CHAPTERS
          </Text>
          {q.data.chapters.map((c, i) => (
            <Card
              key={c.id}
              onPress={() => router.push(c.locked ? '/plans' : `/qbank/${c.id}`)}
              style={{ gap: 12 }}
              accessibilityLabel={`${c.title}, ${c.answered} of ${c.total} answered${c.locked ? ', locked' : ''}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text weight="bold" style={{ color: colors.primaryDark }}>
                    {i + 1}
                  </Text>
                </View>
                <Text weight="semibold" style={{ fontSize: 16, flex: 1 }} numberOfLines={2}>
                  {c.title}
                </Text>
                {c.locked ? <Ionicons name="lock-closed" size={20} color={colors.textMuted} /> : <Ionicons name="chevron-forward" size={22} color={colors.text} />}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ProgressBar value={c.total ? c.answered / c.total : 0} color={q.data.subject.color} />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {c.answered}/{c.total}
                </Text>
                {c.locked ? <Chip label="Premium" tone="orange" /> : c.answered === c.total ? <Chip label={`${percent(c.correct, c.total)}%`} tone="green" /> : null}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
