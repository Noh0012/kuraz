import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { ScreenHeader } from '@/components/Headers';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { keys, useMe, useUpdateMe } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import type { Me } from '@/types/contracts';
import { colors, gutter, radius } from '@/theme/tokens';

type Editing = 'personal' | 'education' | null;

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const [editing, setEditing] = useState<Editing>(null);
  const [uploading, setUploading] = useState(false);

  async function changePhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const form = new FormData();
    const type = asset.mimeType ?? 'image/jpeg';
    // React Native's FormData accepts { uri, name, type } file parts.
    form.append('avatar', { uri: asset.uri, name: asset.fileName ?? `avatar.${type.split('/')[1]}`, type } as unknown as Blob);
    setUploading(true);
    try {
      qc.setQueryData(keys.me, await api<Me>('/me/avatar', { method: 'POST', form }));
    } catch (e) {
      Alert.alert('Could not update photo', errorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  function deleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your profile, progress, test results and plans. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api('/me', { method: 'DELETE' });
              await supabase.auth.signOut({ scope: 'local' });
            } catch (e) {
              Alert.alert('Could not delete the account', errorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Profile" />
      {me.isPending ? (
        <LoadingState />
      ) : me.isError ? (
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 40 }}>
          <Section>
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={changePhoto} disabled={uploading}>
                <UserAvatar url={me.data.avatar_url} size={120} />
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    bottom: 4,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: colors.white,
                  }}
                >
                  <Ionicons name={uploading ? 'hourglass-outline' : 'pencil'} size={18} color={colors.white} />
                </View>
              </Pressable>
            </View>
            <SectionTitle title="Personal details" onEdit={() => setEditing('personal')} />
            <Row label="Name" value={me.data.full_name || '—'} />
            <Row label="Email address" value={me.data.email ?? '—'} />
            <Row label="Mobile number" value={me.data.phone ?? 'Add mobile number'} muted={!me.data.phone} />
            <Row label="Plan" value={me.data.plan ? `${me.data.plan.name} · until ${formatDate(me.data.plan.expires_at)}` : 'No active plan'} />
          </Section>

          <Section>
            <SectionTitle title="Education details" onEdit={() => setEditing('education')} />
            <Row label="Grade" value={me.data.grade?.name ?? '—'} action={{ label: 'Change', onPress: () => router.push('/grade-select') }} />
            <Row label="School" value={me.data.school ?? 'Add your school'} muted={!me.data.school} />
            <Row label="Region" value={me.data.region ?? 'Add your region'} muted={!me.data.region} />
            <Row label="City" value={me.data.city ?? 'Add your city'} muted={!me.data.city} />
          </Section>

          <Pressable
            accessibilityRole="button"
            onPress={deleteAccount}
            style={({ pressed }) => ({ backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}
          >
            <Text weight="medium" style={{ fontSize: 16, color: colors.danger }}>
              Delete my account
            </Text>
          </Pressable>
        </ScrollView>
      )}
      {me.data && editing && <EditSheet me={me.data} section={editing} onClose={() => setEditing(null)} />}
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 16 }}>{children}</View>;
}

function SectionTitle({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: colors.divider, paddingBottom: 12 }}>
      <Text weight="bold" style={{ fontSize: 16, letterSpacing: 0.4 }}>
        {title.toUpperCase()}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title}`} onPress={onEdit} hitSlop={10}>
        <Ionicons name="pencil-outline" size={22} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function Row({
  label,
  value,
  badge,
  muted,
  action,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
  muted?: boolean;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text weight="medium" style={{ fontSize: 13, color: colors.textMuted, letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text weight="medium" style={{ fontSize: 17, flex: 1, color: muted ? colors.textMuted : colors.text }}>
          {value}
        </Text>
        {badge}
        {action && (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
            <Text weight="semibold" style={{ color: colors.primary }}>
              {action.label}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EditSheet({ me, section, onClose }: { me: Me; section: 'personal' | 'education'; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const update = useUpdateMe();
  const [form, setForm] = useState({
    full_name: me.full_name,
    phone: me.phone ?? '',
    school: me.school ?? '',
    region: me.region ?? '',
    city: me.city ?? '',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    try {
      await update.mutateAsync(
        section === 'personal'
          ? { full_name: form.full_name.trim(), phone: form.phone.trim() || null }
          : { school: form.school.trim() || null, region: form.region.trim() || null, city: form.city.trim() || null },
      );
      onClose();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} />
      <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: gutter, paddingBottom: insets.bottom + 20, gap: 16 }}>
        <Text weight="bold" style={{ fontSize: 20 }}>
          {section === 'personal' ? 'Personal details' : 'Education details'}
        </Text>
        {section === 'personal' ? (
          <>
            <Field label="Full name" value={form.full_name} onChangeText={set('full_name')} autoComplete="name" />
            <Field label="Mobile number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+251 9..." />
          </>
        ) : (
          <>
            <Field label="School" value={form.school} onChangeText={set('school')} placeholder="e.g. Hawassa Tabor Secondary School" />
            <Field label="Region" value={form.region} onChangeText={set('region')} placeholder="e.g. Sidama" />
            <Field label="City" value={form.city} onChangeText={set('city')} placeholder="e.g. Hawassa" />
          </>
        )}
        <Button title="Save" size="lg" onPress={save} loading={update.isPending} />
      </View>
    </Modal>
  );
}
