import type { ContinueWatching, SubjectLite, VideoCard, VideoProgress } from '../contracts.js';
import { rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { canAccess, type Entitlements } from './entitlements.js';

// Video joined to its chapter and subject (grade lives on the subject).
export const VIDEO_CARD_SELECT =
  'id, title, duration_seconds, thumbnail_url, is_free, notes_url, sort, chapters!inner(id, title, sort, subjects!inner(id, name, icon, color, teacher_name, teacher_avatar_url, grade_id))' as const;

export interface SubjectRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  teacher_name: string | null;
  teacher_avatar_url: string | null;
}

export interface VideoCardRow {
  id: string;
  title: string;
  duration_seconds: number;
  thumbnail_url: string | null;
  is_free: boolean;
  notes_url: string | null;
  chapters: { id: string; title: string; subjects: SubjectRow & { grade_id: number } };
}

export function toSubjectLite(s: SubjectRow): SubjectLite {
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    color: s.color,
    teacher_name: s.teacher_name,
    teacher_avatar_url: s.teacher_avatar_url,
  };
}

export function toVideoCard(row: VideoCardRow, ent: Entitlements, progress: VideoProgress | null = null): VideoCard {
  const subject = row.chapters.subjects;
  return {
    id: row.id,
    title: row.title,
    duration_seconds: row.duration_seconds,
    thumbnail_url: row.thumbnail_url,
    is_free: row.is_free,
    locked: !canAccess(ent, subject.grade_id, 'videos', row.is_free),
    has_notes: row.notes_url != null,
    subject: toSubjectLite(subject),
    chapter: { id: row.chapters.id, title: row.chapters.title },
    progress,
  };
}

export async function progressFor(userId: string, videoIds: string[]): Promise<Map<string, VideoProgress>> {
  if (videoIds.length === 0) return new Map();
  const data = rows(
    await db
      .from('video_progress')
      .select('video_id, position_seconds, completed')
      .eq('user_id', userId)
      .in('video_id', videoIds),
  );
  return new Map(data.map((p) => [p.video_id, { position_seconds: p.position_seconds, completed: p.completed }]));
}

export async function bookmarkedIds(userId: string, type: 'video' | 'question', ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const data = rows(
    await db.from('bookmarks').select('item_id').eq('user_id', userId).eq('item_type', type).in('item_id', ids),
  );
  return new Set(data.map((b) => b.item_id));
}

/** Most recent unfinished video of the grade, for the "continue watching" bar. */
export async function continueWatching(
  userId: string,
  gradeId: number,
  ent: Entitlements,
): Promise<ContinueWatching | null> {
  const recent = rows(
    await db
      .from('video_progress')
      .select(
        'position_seconds, completed, updated_at, videos!inner(id, title, duration_seconds, thumbnail_url, is_free, notes_url, sort, chapters!inner(id, title, sort, subjects!inner(id, name, icon, color, teacher_name, teacher_avatar_url, grade_id)))',
      )
      .eq('user_id', userId)
      .eq('completed', false)
      .order('updated_at', { ascending: false })
      .limit(10),
  );
  const hit = recent.find((p) => p.videos.chapters.subjects.grade_id === gradeId);
  if (!hit) return null;
  const progress = { position_seconds: hit.position_seconds, completed: hit.completed };
  const video = toVideoCard(hit.videos, ent, progress);
  return { video, remaining_seconds: Math.max(0, video.duration_seconds - hit.position_seconds) };
}
