import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { QuestionOfTheDay } from '@/types/contracts';
import { colors, gradients, gutter, radius } from '@/theme/tokens';
import { Card } from '../Card';
import { Chip } from '../SectionLabel';
import { Text } from '../Text';

/** Monitor-with-play + question-book illustration from the "Free Videos & Qbank" banner. */
function CuratedArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 120 108">
      <Rect x="6" y="8" width="88" height="66" rx="12" fill="#D9ECFF" />
      <Rect x="12" y="14" width="76" height="54" rx="8" fill="#FFFFFF" />
      <Path d="M42 28L66 41L42 54Z" fill="#2563EB" />
      <Rect x="38" y="74" width="24" height="10" fill="#B8D6F7" />
      <Rect x="24" y="84" width="52" height="7" rx="3.5" fill="#B8D6F7" />
      <G transform="rotate(-8 88 70)">
        <Rect x="70" y="44" width="40" height="52" rx="6" fill="#F59E0B" />
        <Rect x="70" y="44" width="34" height="52" rx="6" fill="#FBBF24" />
        <SvgText x="87" y="80" fontSize="30" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
          ?
        </SvgText>
        <Path d="M84 96V104L88 101L92 104V96Z" fill="#EF6C3A" />
      </G>
      <Circle cx="104" cy="16" r="4" fill="#FFFFFF" opacity="0.6" />
    </Svg>
  );
}

export function CuratedBanner({ free }: { free: { videos: number; questions: number } }) {
  const router = useRouter();
  return (
    <LinearGradient
      colors={gradients.curated}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ marginHorizontal: gutter, borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <CuratedArt size={96} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text weight="bold" style={{ color: colors.white, fontSize: 21 }}>
          Free Videos & QBank
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 20 }}>
          {free.videos} expert lessons and {free.questions} practice questions, free for you
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/videos')}
            style={{ flex: 1, backgroundColor: colors.white, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
          >
            <Text weight="semibold" style={{ color: colors.primary, fontSize: 14 }}>
              Free Videos
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/qbank')}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.white, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
          >
            <Text weight="semibold" style={{ color: colors.white, fontSize: 14 }}>
              Free QBank
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

export function QotdCard({ qotd }: { qotd: QuestionOfTheDay }) {
  const router = useRouter();
  const attempt = qotd.question.attempt;
  return (
    <Card onPress={() => router.push('/qotd')} style={{ marginHorizontal: gutter, padding: 20, gap: 14 }} accessibilityLabel="Question of the day">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Text weight="semibold" style={{ fontSize: 15, color: colors.label, letterSpacing: 0.6 }}>
          QUESTION OF THE DAY
        </Text>
        <Chip label={qotd.subject.name} />
      </View>
      <Text weight="medium" style={{ fontSize: 18, lineHeight: 26 }} numberOfLines={4}>
        {qotd.question.stem}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {attempt ? (
          <>
            <Ionicons
              name={attempt.is_correct ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={attempt.is_correct ? colors.success : colors.danger}
            />
            <Text weight="semibold" style={{ color: attempt.is_correct ? colors.success : colors.danger }}>
              {attempt.is_correct ? 'You got it right' : 'Not quite'} · See explanation
            </Text>
          </>
        ) : (
          <>
            <Text weight="semibold" style={{ color: colors.primary }}>
              Answer now
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </>
        )}
      </View>
    </Card>
  );
}
