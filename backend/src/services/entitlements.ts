import type { ContentKind, Plan, Tier } from '../contracts.js';
import { rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';

export interface SubscriptionRow {
  package_id: string;
  starts_at: string | null;
  expires_at: string | null;
  packages: {
    name: string;
    tier: string;
    grade_id: number;
    includes_videos: boolean;
    includes_qbank: boolean;
    includes_tests: boolean;
  };
}

interface Grant {
  packageId: string;
  name: string;
  tier: Tier;
  gradeId: number;
  includes: ContentKind[];
  /** Currently inside a paid period. */
  current: boolean;
  expiresAt: string;
}

export interface Entitlements {
  grants: Grant[];
}

/** Pure: turns active/renewal subscription rows into grants. */
export function buildEntitlements(subs: SubscriptionRow[], now = new Date()): Entitlements {
  const t = now.getTime();
  const grants: Grant[] = [];
  for (const s of subs) {
    if (!s.starts_at || !s.expires_at) continue;
    const start = Date.parse(s.starts_at);
    const end = Date.parse(s.expires_at);
    if (end <= t) continue;
    const includes: ContentKind[] = [];
    if (s.packages.includes_videos) includes.push('videos');
    if (s.packages.includes_qbank) includes.push('qbank');
    if (s.packages.includes_tests) includes.push('tests');
    grants.push({
      packageId: s.package_id,
      name: s.packages.name,
      tier: s.packages.tier === 'premium' ? 'premium' : 'basic',
      gradeId: s.packages.grade_id,
      includes,
      current: start <= t,
      expiresAt: s.expires_at,
    });
  }
  return { grants };
}

export function canAccess(ent: Entitlements, gradeId: number, kind: ContentKind, isFree: boolean): boolean {
  if (isFree) return true;
  return ent.grants.some((g) => g.current && g.gradeId === gradeId && g.includes.includes(kind));
}

/** End of the paid period for a package, counting renewals that start later. */
export function activeUntil(ent: Entitlements, packageId: string): string | null {
  const own = ent.grants.filter((g) => g.packageId === packageId);
  if (!own.some((g) => g.current)) return null;
  return own.reduce((max, g) => (g.expiresAt > max ? g.expiresAt : max), own[0].expiresAt);
}

/** The plan shown in the header ("Premium Plan"); premium wins over basic. */
export function bestPlan(ent: Entitlements, gradeId: number | null): Plan | null {
  if (gradeId == null) return null;
  const current = ent.grants.filter((g) => g.current && g.gradeId === gradeId);
  if (current.length === 0) return null;
  const rank = (g: Grant) => (g.tier === 'premium' ? 1 : 0);
  const best = current.reduce((a, b) => (rank(b) > rank(a) || (rank(b) === rank(a) && b.expiresAt > a.expiresAt) ? b : a));
  return {
    package_id: best.packageId,
    name: best.name,
    tier: best.tier,
    grade_id: best.gradeId,
    includes: best.includes,
    expires_at: activeUntil(ent, best.packageId) ?? best.expiresAt,
  };
}

export async function loadEntitlements(userId: string, now = new Date()): Promise<Entitlements> {
  const subs = rows(
    await db
      .from('subscriptions')
      .select(
        'package_id, starts_at, expires_at, packages!inner(name, tier, grade_id, includes_videos, includes_qbank, includes_tests)',
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', now.toISOString()),
  );
  return buildEntitlements(subs, now);
}
