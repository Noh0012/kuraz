import type { Grade, Me } from '../contracts.js';
import type { Tables } from '../db/types.js';
import { HttpError, maybe, ok } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { bestPlan, type Entitlements } from './entitlements.js';

export type ProfileRow = Tables<'profiles'> & { grades: Grade | null };

const PROFILE_SELECT = '*, grades(id, name)' as const;

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  return maybe(await db.from('profiles').select(PROFILE_SELECT).eq('id', userId).maybeSingle());
}

/** Loads the profile, creating it if the signup trigger did not (it never blocks signup). */
export async function getProfile(userId: string): Promise<ProfileRow> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Account not found');
  const meta = data.user.user_metadata ?? {};
  const gradeId = Number(meta.grade_id);
  ok(
    await db.from('profiles').upsert(
      {
        id: userId,
        email: data.user.email ?? null,
        full_name: typeof meta.full_name === 'string' ? meta.full_name.slice(0, 120) : '',
        grade_id: gradeId >= 9 && gradeId <= 12 ? gradeId : null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    ),
  );
  const created = await fetchProfile(userId);
  if (!created) throw new HttpError(500, 'internal', 'Could not create profile');
  return created;
}

/** Most screens are per-grade; the app sends students to the grade picker on this error. */
export function requireGrade(profile: ProfileRow): number {
  if (profile.grade_id == null) throw new HttpError(409, 'grade_required', 'Choose your grade first');
  return profile.grade_id;
}

export function toMe(profile: ProfileRow, ent: Entitlements): Me {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    grade: profile.grades ? { id: profile.grades.id, name: profile.grades.name } : null,
    school: profile.school,
    region: profile.region,
    city: profile.city,
    avatar_url: profile.avatar_url,
    plan: bestPlan(ent, profile.grade_id),
  };
}
