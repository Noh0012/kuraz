import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/Headers';
import { Chip } from '@/components/SectionLabel';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { errorMessage, isLocked } from '@/lib/api';
import { formatDate, formatDay, percent } from '@/lib/format';
import { useStartAttempt, useTest } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

const RULES = [
  { icon: 'timer-outline', text: 'The timer starts when you begin and keeps running even if you leave the app.' },
  { icon: 'cloud-done-outline', text: 'Your answers are saved automatically. You can resume an unfinished attempt.' },
  { icon: 'checkmark-done-outline', text: 'When time is up the test is submitted for you.' },
  { icon: 'bulb-outline', text: 'After submitting you can review every answer with explanations.' },
] as const;

export default function TestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const test = useTest(id);
  const start = useStartAttempt();

  async function begin() {
    try {
      const session = await start.mutateAsync(id);
      qc.setQueryData(['attempt-session', session.attempt.id], session);
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['test', id] });
      router.push({ pathname: '/attempt/[id]', params: { id: session.attempt.id, test: id } });
    } catch (e) {
      if (isLocked(e)) router.push('/plans');
      else Alert.alert('Could not start the test', errorMessage(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Test" />
      {test.isPending ? (
        <LoadingState />
      ) : test.isError ? (
        <ErrorState error={test.error} onRetry={() => test.refetch()} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 40 }}>
            <LinearGradient colors={['#1F4FD1', '#13308F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, padding: 20, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name={test.data.type === 'national' ? 'school' : 'clipboard-text-clock'} size={26} color={colors.white} />
                <Text weight="semibold" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>
                  {test.data.type === 'national' ? `NATIONAL EXAM · ${test.data.year_label ?? ''}` : test.data.type === 'mock' ? 'MOCK TEST' : 'UNIT TEST'}
                </Text>
              </View>
              <Text weight="bold" style={{ color: colors.white, fontSize: 22, lineHeight: 28 }}>
                {test.data.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: 18 }}>
                <Stat icon="help-circle-outline" label={`${test.data.question_count} questions`} />
                <Stat icon="time-outline" label={`${test.data.duration_minutes} minutes`} />
              </View>
            </LinearGradient>

            {test.data.description && <Text style={{ color: colors.textSoft, lineHeight: 22 }}>{test.data.description}</Text>}

            <Card style={{ gap: 14 }}>
              <Text weight="semibold" style={{ fontSize: 16 }}>
                Before you start
              </Text>
              {RULES.map((r) => (
                <View key={r.text} style={{ flexDirection: 'row', gap: 12 }}>
                  <Ionicons name={r.icon} size={20} color={colors.primary} />
                  <Text style={{ flex: 1, color: colors.textSoft, lineHeight: 21 }}>{r.text}</Text>
                </View>
              ))}
            </Card>

            {test.data.attempts.some((a) => a.submitted_at) && (
              <View style={{ gap: 10 }}>
                <Text weight="semibold" style={{ fontSize: 15, color: colors.label, letterSpacing: 0.6 }}>
                  YOUR ATTEMPTS
                </Text>
                {test.data.attempts
                  .filter((a) => a.submitted_at)
                  .map((a) => (
                    <Pressable
                      key={a.id}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/attempt/[id]/result', params: { id: a.id } })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 }}
                    >
                      <Text weight="bold" style={{ fontSize: 18, color: colors.primaryDark, width: 64 }}>
                        {a.score}/{a.total}
                      </Text>
                      <Text style={{ flex: 1, color: colors.textMuted }}>{formatDate(a.submitted_at!)}</Text>
                      <Chip label={`${percent(a.score ?? 0, a.total ?? 0)}%`} tone={percent(a.score ?? 0, a.total ?? 0) >= 50 ? 'green' : 'orange'} />
                      <Ionicons name="chevron-forward" size={20} color={colors.text} />
                    </Pressable>
                  ))}
              </View>
            )}
          </ScrollView>
          <View style={{ padding: gutter, paddingBottom: insets.bottom + 14, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.divider }}>
            {test.data.locked ? (
              <Button title="Unlock with Premium" variant="orange" icon="lock-open" size="lg" onPress={() => router.push('/plans')} />
            ) : test.data.opens_on ? (
              <Button title={`Opens on ${formatDay(test.data.opens_on)}`} variant="outline" size="lg" disabled />
            ) : (
              <Button
                title={test.data.open_attempt_id ? 'Resume test' : test.data.attempts.length ? 'Retake test' : 'Start test'}
                icon="play"
                size="lg"
                loading={start.isPending}
                onPress={begin}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

function Stat({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.9)" />
      <Text weight="medium" style={{ color: colors.white }}>
        {label}
      </Text>
    </View>
  );
}
