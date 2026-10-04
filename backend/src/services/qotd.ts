import { rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';

/** Today's date (YYYY-MM-DD) in Ethiopia, so the question flips at local midnight. */
export function addisDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** 32-bit FNV-1a: small, stable across Node versions. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic index for a date + grade; -1 when there is nothing to pick. */
export function pickIndex(date: string, gradeId: number, count: number): number {
  if (count <= 0) return -1;
  return fnv1a(`${date}:${gradeId}`) % count;
}

/** Same question for every student of a grade on a given day. */
export async function questionOfTheDayId(gradeId: number, now = new Date()): Promise<string | null> {
  const candidates = rows(
    await db
      .from('questions')
      .select('id, subjects!inner(grade_id)')
      .eq('subjects.grade_id', gradeId)
      .not('chapter_id', 'is', null)
      .order('id'),
  );
  const index = pickIndex(addisDate(now), gradeId, candidates.length);
  return index < 0 ? null : candidates[index].id;
}
