import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/Headers';
import { Text } from '@/components/Text';
import { api, errorMessage } from '@/lib/api';
import { colors, fonts, gutter, radius } from '@/theme/tokens';

const CATEGORIES = [
  { key: 'video', label: 'Video' },
  { key: 'question', label: 'Question' },
  { key: 'test', label: 'Test' },
  { key: 'payment', label: 'Payment' },
  { key: 'account', label: 'Account' },
  { key: 'app', label: 'App bug' },
  { key: 'other', label: 'Other' },
] as const;

export default function ReportIssue() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; ref?: string }>();
  const [category, setCategory] = useState<string>(params.category ?? 'app');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (message.trim().length < 5) {
      Alert.alert('Tell us a little more', 'Describe the problem in a sentence or two.');
      return;
    }
    setBusy(true);
    try {
      await api('/issues', {
        method: 'POST',
        body: { category, message: message.trim(), context: { platform: Platform.OS, ref: params.ref ?? null } },
      });
      setSent(true);
    } catch (e) {
      Alert.alert('Could not send', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Report an issue" />
      {sent ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text weight="bold" style={{ fontSize: 22 }}>
            Thanks for telling us
          </Text>
          <Text style={{ color: colors.textSoft, textAlign: 'center', lineHeight: 22 }}>Our team will look into it. We may contact you by email.</Text>
          <Button title="Done" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 12 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text weight="semibold" style={{ fontSize: 13, color: colors.label, letterSpacing: 0.4 }}>
            WHAT IS IT ABOUT?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8 }}>
            {CATEGORIES.map((c) => {
              const active = c.key === category;
              return (
                <Pressable
                  key={c.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setCategory(c.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : colors.white,
                  }}
                >
                  <Text weight="medium" style={{ color: active ? colors.primaryDark : colors.textSoft }}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text weight="semibold" style={{ fontSize: 13, color: colors.label, letterSpacing: 0.4 }}>
            DESCRIBE THE PROBLEM
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
            placeholder="What happened? What did you expect?"
            placeholderTextColor={colors.textMuted}
            style={{
              marginTop: -8,
              minHeight: 160,
              textAlignVertical: 'top',
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.md,
              backgroundColor: colors.white,
              padding: 14,
              fontFamily: fonts.regular,
              fontSize: 16,
              color: colors.text,
            }}
          />
          <Button title="Send report" size="lg" icon="send" onPress={send} loading={busy} />
        </ScrollView>
      )}
    </View>
  );
}
