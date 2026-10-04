import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/Headers';
import { QuestionView } from '@/components/QuestionView';
import { Chip } from '@/components/SectionLabel';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { errorMessage } from '@/lib/api';
import { formatDay } from '@/lib/format';
import { keys, useAnswerQuestion, useQotd } from '@/lib/queries';
import type { AnswerReveal } from '@/types/contracts';
import { colors, gutter } from '@/theme/tokens';

export default function QuestionOfTheDayScreen() {
  const qc = useQueryClient();
  const qotd = useQotd();
  const answer = useAnswerQuestion();
  const [pending, setPending] = useState<string | null>(null);
  const [reveal, setReveal] = useState<AnswerReveal | null>(null);

  async function choose(option: string) {
    if (!qotd.data) return;
    setPending(option);
    try {
      setReveal(await answer.mutateAsync({ questionId: qotd.data.question.id, option }));
      qc.invalidateQueries({ queryKey: keys.home });
    } catch (e) {
      Alert.alert('Could not check your answer', errorMessage(e));
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Question of the day" />
      {qotd.isPending ? (
        <LoadingState />
      ) : qotd.isError ? (
        <ErrorState error={qotd.error} onRetry={() => qotd.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Chip label={qotd.data.subject.name} />
            <Text style={{ color: colors.textMuted }}>{formatDay(qotd.data.date)}</Text>
          </View>
          <Card style={{ padding: 18 }}>
            <QuestionView
              stem={qotd.data.question.stem}
              options={qotd.data.question.options}
              reveal={reveal ?? qotd.data.question.attempt}
              pendingOption={pending}
              onSelect={choose}
            />
          </Card>
          <Text style={{ color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
            A new question every day at midnight, free for every student in your grade.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
