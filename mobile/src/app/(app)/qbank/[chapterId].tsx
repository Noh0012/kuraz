import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/Headers';
import { LockedView } from '@/components/LockedView';
import { QuestionView } from '@/components/QuestionView';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { errorMessage, isLocked } from '@/lib/api';
import { useAnswerQuestion, useChapterQuestions, useToggleBookmark } from '@/lib/queries';
import type { AnswerReveal } from '@/types/contracts';
import { colors, gutter } from '@/theme/tokens';

/** One-question-at-a-time practice with instant feedback. */
export default function ChapterPractice() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const insets = useSafeAreaInsets();
  const q = useChapterQuestions(chapterId);
  const answer = useAnswerQuestion();
  const bookmark = useToggleBookmark();
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [reveals, setReveals] = useState<Record<string, AnswerReveal>>({});
  const scroller = useRef<ScrollView>(null);
  const started = useRef(false);

  const questions = useMemo(() => q.data?.questions ?? [], [q.data]);
  const revealFor = (id: string) => reveals[id] ?? questions.find((x) => x.id === id)?.attempt ?? null;

  // Open on the first unanswered question.
  useEffect(() => {
    if (started.current || !questions.length) return;
    started.current = true;
    const first = questions.findIndex((x) => !x.attempt);
    setIndex(first === -1 ? 0 : first);
  }, [questions]);

  if (q.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="QBank" />
        <LoadingState />
      </View>
    );
  }
  if (q.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="QBank" />
        {isLocked(q.error) ? <LockedView what="This chapter" /> : <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      </View>
    );
  }
  if (!questions.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title={q.data.chapter.title} />
        <EmptyState title="No questions yet" message="Questions for this chapter are coming soon." />
      </View>
    );
  }

  const current = questions[Math.min(index, questions.length - 1)];
  const reveal = revealFor(current.id);
  const answeredCount = questions.filter((x) => revealFor(x.id)).length;

  async function choose(option: string) {
    setPending(option);
    try {
      const result = await answer.mutateAsync({ questionId: current.id, option });
      setReveals((r) => ({ ...r, [current.id]: result }));
    } catch (e) {
      Alert.alert('Could not check your answer', errorMessage(e));
    } finally {
      setPending(null);
    }
  }

  const go = (i: number) => {
    setIndex(i);
    scroller.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={q.data.chapter.title}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={current.bookmarked ? 'Remove bookmark' : 'Bookmark question'}
            onPress={() => bookmark.mutate({ type: 'question', id: current.id, on: !current.bookmarked })}
            hitSlop={10}
            style={{ padding: 6 }}
          >
            <Ionicons name={current.bookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={colors.primary} />
          </Pressable>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, backgroundColor: colors.white }} contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 12, gap: 8 }}>
        {questions.map((x, i) => {
          const r = revealFor(x.id);
          const bg = r ? (r.is_correct ? colors.success : colors.danger) : colors.white;
          return (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              accessibilityLabel={`Question ${i + 1}${r ? (r.is_correct ? ', correct' : ', wrong') : ''}`}
              onPress={() => go(i)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: bg,
                borderWidth: i === index ? 2.5 : 1.5,
                borderColor: i === index ? colors.ink : r ? bg : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text weight="semibold" style={{ color: r ? colors.white : colors.text }}>
                {i + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView ref={scroller} contentContainerStyle={{ padding: gutter, paddingBottom: 32, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text weight="semibold" style={{ color: colors.label }}>
            QUESTION {index + 1} OF {questions.length}
          </Text>
          <Text style={{ color: colors.textMuted }}>{answeredCount} answered</Text>
        </View>
        <QuestionView stem={current.stem} options={current.options} reveal={reveal} pendingOption={pending} onSelect={choose} />
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: gutter,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <Button title="Previous" variant="outline" icon="chevron-back" disabled={index === 0} onPress={() => go(index - 1)} style={{ flex: 1 }} />
        <Button
          title={index === questions.length - 1 ? 'Done' : 'Next'}
          variant={reveal ? 'primary' : 'outline'}
          onPress={() => (index === questions.length - 1 ? Alert.alert('Chapter complete', `You answered ${answeredCount} of ${questions.length} questions.`) : go(index + 1))}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
