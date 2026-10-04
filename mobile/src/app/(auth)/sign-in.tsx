import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    // On success the root layout's guard swaps to the app automatically.
    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'That email and password do not match. Please try again.'
          : authError.message === 'Email not confirmed'
            ? 'Please confirm your email address first (check your inbox).'
            : authError.message,
      );
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue with your lessons, QBank and national exam practice.">
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secure
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {error && (
        <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 12 }}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      )}
      <Button title="Sign in" size="lg" onPress={submit} loading={busy} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 }}>
        <Text style={{ color: colors.textSoft }}>New to Kuraz?</Text>
        <Link href="/sign-up" replace>
          <Text weight="semibold" style={{ color: colors.primary }}>
            Create an account
          </Text>
        </Link>
      </View>
    </AuthShell>
  );
}
