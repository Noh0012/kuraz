import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Text } from '@/components/Text';
import { useGrades } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/theme/tokens';

// Used if the API is unreachable, so students can still sign up.
const FALLBACK_GRADES = [9, 10, 11, 12].map((id) => ({ id, name: `Grade ${id}` }));

export default function SignUp() {
  const grades = useGrades();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (phone.trim() && !/^\+?[0-9 ]{7,20}$/.test(phone.trim())) next.phone = 'Enter a valid phone number, e.g. +251 9...';
    if (!gradeId) next.grade = 'Choose your grade';
    if (password.length < 8) next.password = 'Use at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    setFormError(null);
    if (!validate()) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), grade_id: gradeId, phone: phone.trim() || null } },
    });
    setBusy(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    // With email confirmation on, Supabase returns no session until the link is clicked.
    if (!data.session) setNotice(`We sent a confirmation link to ${email.trim()}. Open it, then sign in.`);
  }

  if (notice) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to activate your account.">
        <Text style={{ fontSize: 16, lineHeight: 24 }}>{notice}</Text>
        <Link href="/sign-in" replace asChild>
          <Button title="Back to sign in" size="lg" />
        </Link>
      </AuthShell>
    );
  }

  const gradeList = grades.data?.length ? grades.data : FALLBACK_GRADES;

  return (
    <AuthShell title="Create your account" subtitle="Choose your grade to get videos, practice questions and tests made for it.">
      <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="e.g. Abebe Kebede" autoComplete="name" error={errors.fullName} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={errors.email}
      />
      <Field
        label="Mobile number (optional)"
        value={phone}
        onChangeText={setPhone}
        placeholder="+251 9..."
        keyboardType="phone-pad"
        autoComplete="tel"
        error={errors.phone}
      />
      <View style={{ gap: 8 }}>
        <Text weight="semibold" style={{ fontSize: 13, color: colors.label, letterSpacing: 0.4 }}>
          YOUR GRADE
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {gradeList.map((g) => {
            const selected = g.id === gradeId;
            return (
              <Pressable
                key={g.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={g.name}
                onPress={() => setGradeId(g.id)}
                style={{
                  flex: 1,
                  height: 64,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: selected ? colors.primaryDark : colors.textMuted }}>Grade</Text>
                <Text weight="bold" style={{ fontSize: 20, color: selected ? colors.primaryDark : colors.text }}>
                  {g.id}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.grade && <Text style={{ color: colors.danger, fontSize: 13 }}>{errors.grade}</Text>}
      </View>
      <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secure autoComplete="new-password" error={errors.password} />
      {formError && (
        <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 12 }}>
          <Text style={{ color: colors.danger }}>{formError}</Text>
        </View>
      )}
      <Button title="Create account" size="lg" onPress={submit} loading={busy} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text style={{ color: colors.textSoft }}>Already have an account?</Text>
        <Link href="/sign-in" replace>
          <Text weight="semibold" style={{ color: colors.primary }}>
            Sign in
          </Text>
        </Link>
      </View>
    </AuthShell>
  );
}
