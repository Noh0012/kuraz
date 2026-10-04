import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { AnswerReveal, QuestionOption } from '@/types/contracts';
import { alpha, colors, radius } from '@/theme/tokens';
import { Text } from './Text';

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

const STATE_STYLE: Record<OptionState, { border: string; bg: string; badgeBg: string; badgeFg: string }> = {
  idle: { border: colors.border, bg: colors.white, badgeBg: colors.divider, badgeFg: colors.textSoft },
  selected: { border: colors.primary, bg: alpha(colors.primary, 0.06), badgeBg: colors.primary, badgeFg: colors.white },
  correct: { border: colors.success, bg: colors.successSoft, badgeBg: colors.success, badgeFg: colors.white },
  wrong: { border: colors.danger, bg: colors.dangerSoft, badgeBg: colors.danger, badgeFg: colors.white },
  dim: { border: colors.border, bg: colors.white, badgeBg: colors.divider, badgeFg: colors.textMuted },
};

export function OptionRow({
  option,
  state,
  onPress,
  disabled,
}: {
  option: QuestionOption;
  state: OptionState;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const s = STATE_STYLE[state];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: state === 'selected' || state === 'correct' || state === 'wrong', disabled }}
      accessibilityLabel={`Option ${option.key}: ${option.text}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1.5,
        borderColor: s.border,
        backgroundColor: s.bg,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.badgeBg, alignItems: 'center', justifyContent: 'center' }}>
        {state === 'correct' || state === 'wrong' ? (
          <Ionicons name={state === 'correct' ? 'checkmark' : 'close'} size={18} color={s.badgeFg} />
        ) : (
          <Text weight="bold" style={{ color: s.badgeFg, fontSize: 14 }}>
            {option.key}
          </Text>
        )}
      </View>
      <Text style={{ flex: 1, fontSize: 16, lineHeight: 22, color: state === 'dim' ? colors.textMuted : colors.text }}>{option.text}</Text>
    </Pressable>
  );
}

/** Practice question: tap an option to check it; afterwards shows the right answer and explanation. */
export function QuestionView({
  stem,
  options,
  reveal,
  pendingOption,
  onSelect,
}: {
  stem: string;
  options: QuestionOption[];
  reveal: AnswerReveal | null;
  pendingOption?: string | null;
  onSelect?: (key: string) => void;
}) {
  const stateFor = (key: string): OptionState => {
    if (!reveal) return pendingOption === key ? 'selected' : 'idle';
    if (key === reveal.correct_option) return 'correct';
    if (key === reveal.selected_option) return 'wrong';
    return 'dim';
  };
  return (
    <View style={{ gap: 12 }}>
      <Text weight="medium" style={{ fontSize: 18, lineHeight: 27 }}>
        {stem}
      </Text>
      <View style={{ gap: 10, marginTop: 4 }}>
        {options.map((o) => (
          <OptionRow
            key={o.key}
            option={o}
            state={stateFor(o.key)}
            disabled={!!reveal || !!pendingOption || !onSelect}
            onPress={() => onSelect?.(o.key)}
          />
        ))}
      </View>
      {reveal && <Explanation reveal={reveal} />}
    </View>
  );
}

export function Explanation({ reveal }: { reveal: Pick<AnswerReveal, 'is_correct' | 'correct_option' | 'explanation'> }) {
  return (
    <View
      style={{
        marginTop: 6,
        borderRadius: radius.md,
        padding: 14,
        backgroundColor: reveal.is_correct ? colors.successSoft : '#F3F6FB',
        borderLeftWidth: 4,
        borderLeftColor: reveal.is_correct ? colors.success : colors.primary,
        gap: 6,
      }}
    >
      <Text weight="bold" style={{ color: reveal.is_correct ? colors.success : colors.text }}>
        {reveal.is_correct ? 'Correct!' : `Correct answer: ${reveal.correct_option}`}
      </Text>
      {reveal.explanation && <Text style={{ color: colors.textSoft, lineHeight: 22 }}>{reveal.explanation}</Text>}
    </View>
  );
}
