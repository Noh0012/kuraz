import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { OptionRow } from '@/components/QuestionView';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatClock } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { AttemptResult, AttemptSession } from '@/types/contracts';
import { colors, gutter } from '@/theme/tokens';

/** Timed test runner: autosaves answers, survives app restarts (resume) and auto-submits at the deadline. */
export default function AttemptScreen() {
  const { id, test: testId } = useLocalSearchParams<{ id: string; test?: string }>();
  const qc = useQueryClient();
  // Normally handed over by the test screen; re-fetched (resumed) if the app was restarted.
  const session = useQuery({
    queryKey: ['attempt-session', id],
    queryFn: () => api<AttemptSession>(`/tests/${testId}/attempts`, { method: 'POST' }),
    enabled: !!testId || !!qc.getQueryData(['attempt-session', id]),
    staleTime: Infinity,
  });

  if (session.isPending) return <LoadingState label="Loading your test…" />;
  if (session.isError) return <ErrorState error={session.error} onRetry={() => session.refetch()} />;
  return <Runner session={session.data} />;
}

function Runner({ session }: { session: AttemptSession }) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const attemptId = session.attempt.id;
  const { questions } = session;

  const [answers, setAnswers] = useState<Record<string, string>>(session.attempt.answers);
  const [index, setIndex] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const finished = useRef(false);
  const dirty = useRef<Record<string, string | null>>({});

  // Server clock offset, so a wrong phone clock cannot add time.
  const offset = useRef(Date.parse(session.server_time) - Date.now()).current;
  const deadline = Date.parse(session.attempt.deadline_at);
  const [remaining, setRemaining] = useState(() => (deadline - (Date.now() + offset)) / 1000);

  const flush = useCallback(async () => {
    const pending = dirty.current;
    if (!Object.keys(pending).length) return;
    dirty.current = {};
    try {
      await api(`/attempts/${attemptId}/answers`, { method: 'PUT', body: { answers: pending } });
    } catch (e) {
      // Keep unsent answers for the next try unless the attempt is closed.
      if (!(e instanceof ApiError && e.status === 409)) dirty.current = { ...pending, ...dirty.current };
    }
  }, [attemptId]);

  const submit = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    setSubmitting(true);
    try {
      const result = await api<AttemptResult>(`/attempts/${attemptId}/submit`, { method: 'POST', body: { answers: { ...answers, ...dirty.current } } });
      qc.setQueryData(keys.attemptResult(attemptId), result);
      qc.removeQueries({ queryKey: ['attempt-session', attemptId] });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['test'] });
      router.replace({ pathname: '/attempt/[id]/result', params: { id: attemptId } });
    } catch (e) {
      finished.current = false;
      setSubmitting(false);
      Alert.alert('Could not submit', `${errorMessage(e)}\n\nYour answers are saved. Try again.`);
    }
  }, [answers, attemptId, qc, router]);

  // Countdown; submits automatically when time runs out.
  useEffect(() => {
    const timer = setInterval(() => {
      const left = (deadline - (Date.now() + offset)) / 1000;
      setRemaining(left);
      if (left <= 0) submit();
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, offset, submit]);

  // Autosave every few seconds while answering.
  useEffect(() => {
    const saver = setInterval(flush, 4000);
    return () => {
      clearInterval(saver);
      flush();
    };
  }, [flush]);

  // Leaving mid-test: answers are kept and the attempt can be resumed.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (finished.current) return;
      e.preventDefault();
      Alert.alert('Leave the test?', 'Your answers are saved and the timer keeps running. You can resume from the test page.', [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            finished.current = true;
            flush();
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
  }, [navigation, flush]);

  const current = questions[index];
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  function select(key: string) {
    const next = answers[current.id] === key ? null : key; // tap again to clear
    setAnswers((a) => {
      const copy = { ...a };
      if (next) copy[current.id] = next;
      else delete copy[current.id];
      return copy;
    });
    dirty.current[current.id] = next;
  }

  function confirmSubmit() {
    const unanswered = questions.length - answeredCount;
    Alert.alert(
      'Submit test?',
      unanswered ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}.` : 'You have answered every question.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Submit', onPress: submit },
      ],
    );
  }

  const low = remaining < 60;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Leave test" onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text weight="semibold" numberOfLines={1}>
            {session.test.title}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {answeredCount}/{questions.length} answered
          </Text>
        </View>
        <View
          accessibilityLabel={`Time left ${formatClock(remaining)}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: low ? colors.dangerSoft : colors.primarySoft }}
        >
          <Ionicons name="time-outline" size={16} color={low ? colors.danger : colors.primaryDark} />
          <Text weight="bold" style={{ color: low ? colors.danger : colors.primaryDark, fontVariant: ['tabular-nums'] }}>
            {formatClock(remaining)}
          </Text>
        </View>
        <Button title="Submit" size="sm" onPress={confirmSubmit} loading={submitting} />
      </View>

      <ScrollView contentContainerStyle={{ padding: gutter, gap: 14, paddingBottom: 32 }}>
        <Text weight="semibold" style={{ color: colors.label }}>
          QUESTION {index + 1} OF {questions.length}
        </Text>
        <Text weight="medium" style={{ fontSize: 18, lineHeight: 27 }}>
          {current.stem}
        </Text>
        <View style={{ gap: 10 }}>
          {current.options.map((o) => (
            <OptionRow key={o.key} option={o} state={answers[current.id] === o.key ? 'selected' : 'idle'} onPress={() => select(o.key)} />
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: gutter,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <Button title="Prev" variant="outline" icon="chevron-back" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="All questions"
          onPress={() => setPaletteOpen(true)}
          style={{ height: 46, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="grid-outline" size={18} color={colors.primaryDark} />
          <Text weight="semibold" style={{ color: colors.primaryDark }}>
            {index + 1}/{questions.length}
          </Text>
        </Pressable>
        {index === questions.length - 1 ? (
          <Button title="Finish" onPress={confirmSubmit} style={{ flex: 1 }} />
        ) : (
          <Button title="Next" onPress={() => setIndex(index + 1)} style={{ flex: 1 }} />
        )}
      </View>

      <Modal visible={paletteOpen} transparent animationType="fade" onRequestClose={() => setPaletteOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }} onPress={() => setPaletteOpen(false)}>
          <Pressable style={{ backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: gutter, paddingBottom: insets.bottom + 20, gap: 16 }}>
            <Text weight="bold" style={{ fontSize: 18 }}>
              All questions
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {questions.map((q, i) => {
                const done = !!answers[q.id];
                return (
                  <Pressable
                    key={q.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Question ${i + 1}${done ? ', answered' : ''}`}
                    onPress={() => {
                      setIndex(i);
                      setPaletteOpen(false);
                    }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      backgroundColor: done ? colors.primary : colors.white,
                      borderWidth: i === index ? 2.5 : 1.5,
                      borderColor: i === index ? colors.ink : done ? colors.primary : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text weight="semibold" style={{ color: done ? colors.white : colors.text }}>
                      {i + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Legend color={colors.primary} label={`Answered (${answeredCount})`} />
              <Legend color={colors.white} border label={`Not answered (${questions.length - answeredCount})`} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color, borderWidth: border ? 1.5 : 0, borderColor: colors.border }} />
      <Text style={{ color: colors.textSoft, fontSize: 13 }}>{label}</Text>
    </View>
  );
}
