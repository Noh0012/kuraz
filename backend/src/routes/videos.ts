import { Router } from 'express';
import { z } from 'zod';
import type { SubjectSummary, SubjectVideos, VideoDetail } from '../contracts.js';
import { userId } from '../middleware/auth.js';
import { lockedError, maybe, one, ok, rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import {
  bookmarkedIds,
  continueWatching,
  progressFor,
  toSubjectLite,
  toVideoCard,
  VIDEO_CARD_SELECT,
} from '../services/catalog.js';
import { canAccess, loadEntitlements } from '../services/entitlements.js';
import { getProfile, requireGrade } from '../services/profile.js';

export const videoRoutes = Router();

const uuid = z.uuid();

/** Subjects of a grade with video counts and QBank progress (used by both the Videos and QBank tabs). */
videoRoutes.get('/subjects', async (req, res) => {
  const uid = userId(req);
  const profile = await getProfile(uid);
  const gradeId = req.query.grade_id ? z.coerce.number().int().parse(req.query.grade_id) : requireGrade(profile);

  const [subjects, answered] = await Promise.all([
    db
      .from('subjects')
      .select(
        'id, name, icon, color, teacher_name, teacher_avatar_url, chapters(id, videos(id)), questions(id, chapter_id)',
      )
      .eq('grade_id', gradeId)
      .order('sort'),
    db
      .from('question_attempts')
      .select('question_id, questions!inner(subject_id, chapter_id, subjects!inner(grade_id))')
      .eq('user_id', uid)
      .eq('questions.subjects.grade_id', gradeId),
  ]);

  const answeredBySubject = new Map<string, number>();
  for (const a of rows(answered)) {
    if (!a.questions.chapter_id) continue; // exam-paper questions are not part of the QBank
    answeredBySubject.set(a.questions.subject_id, (answeredBySubject.get(a.questions.subject_id) ?? 0) + 1);
  }

  const body: SubjectSummary[] = rows(subjects).map((s) => ({
    ...toSubjectLite(s),
    chapter_count: s.chapters.length,
    video_count: s.chapters.reduce((n, c) => n + c.videos.length, 0),
    qbank: {
      answered: answeredBySubject.get(s.id) ?? 0,
      total: s.questions.filter((q) => q.chapter_id != null).length,
    },
  }));
  res.json(body);
});

videoRoutes.get('/subjects/:id/videos', async (req, res) => {
  const uid = userId(req);
  const subjectId = uuid.parse(req.params.id);
  const [subject, ent] = await Promise.all([
    db
      .from('subjects')
      .select(
        'id, name, icon, color, teacher_name, teacher_avatar_url, grade_id, chapters(id, title, sort, videos(id, title, duration_seconds, thumbnail_url, is_free, notes_url, sort))',
      )
      .eq('id', subjectId)
      .maybeSingle(),
    loadEntitlements(uid),
  ]);
  const s = one(subject, 'Subject');
  const chapters = [...s.chapters].sort((a, b) => a.sort - b.sort);
  const videoIds = chapters.flatMap((c) => c.videos.map((v) => v.id));
  const [progress, bookmarks] = await Promise.all([progressFor(uid, videoIds), bookmarkedIds(uid, 'video', videoIds)]);

  const body: SubjectVideos = {
    subject: toSubjectLite(s),
    chapters: chapters.map((c) => ({
      id: c.id,
      title: c.title,
      videos: [...c.videos]
        .sort((a, b) => a.sort - b.sort)
        .map((v) => ({
          id: v.id,
          title: v.title,
          duration_seconds: v.duration_seconds,
          thumbnail_url: v.thumbnail_url,
          is_free: v.is_free,
          locked: !canAccess(ent, s.grade_id, 'videos', v.is_free),
          has_notes: v.notes_url != null,
          bookmarked: bookmarks.has(v.id),
          progress: progress.get(v.id) ?? null,
        })),
    })),
  };
  res.json(body);
});

videoRoutes.get('/videos/continue', async (req, res) => {
  const uid = userId(req);
  const [profile, ent] = await Promise.all([getProfile(uid), loadEntitlements(uid)]);
  res.json(await continueWatching(uid, requireGrade(profile), ent));
});

videoRoutes.get('/videos/:id', async (req, res) => {
  const uid = userId(req);
  const videoId = uuid.parse(req.params.id);
  const [video, ent] = await Promise.all([
    db
      .from('videos')
      .select(`${VIDEO_CARD_SELECT}, description, source_url` as const)
      .eq('id', videoId)
      .maybeSingle(),
    loadEntitlements(uid),
  ]);
  const v = one(video, 'Video');
  const gradeId = v.chapters.subjects.grade_id;
  if (!canAccess(ent, gradeId, 'videos', v.is_free)) throw lockedError();

  // Next lesson: following video in the chapter, else the first video of the next chapter.
  const [progress, bookmarks, siblings] = await Promise.all([
    progressFor(uid, [videoId]),
    bookmarkedIds(uid, 'video', [videoId]),
    db
      .from('chapters')
      .select('id, sort, videos(id, title, is_free, sort)')
      .eq('subject_id', v.chapters.subjects.id)
      .order('sort'),
  ]);
  const ordered = rows(siblings).flatMap((c) => [...c.videos].sort((a, b) => a.sort - b.sort));
  const nextVideo = ordered[ordered.findIndex((x) => x.id === videoId) + 1];

  const card = toVideoCard(v, ent, progress.get(videoId) ?? null);
  const body: VideoDetail = {
    ...card,
    description: v.description,
    source_url: v.source_url,
    notes_url: v.notes_url,
    bookmarked: bookmarks.has(videoId),
    next: nextVideo
      ? { id: nextVideo.id, title: nextVideo.title, locked: !canAccess(ent, gradeId, 'videos', nextVideo.is_free) }
      : null,
  };
  res.json(body);
});

const progressSchema = z.object({
  position_seconds: z.number().min(0).max(24 * 3600),
  completed: z.boolean().optional(),
});

videoRoutes.put('/videos/:id/progress', async (req, res) => {
  const uid = userId(req);
  const videoId = uuid.parse(req.params.id);
  const body = progressSchema.parse(req.body);
  const [video, ent] = await Promise.all([
    db
      .from('videos')
      .select('id, duration_seconds, is_free, chapters!inner(subjects!inner(grade_id))')
      .eq('id', videoId)
      .maybeSingle(),
    loadEntitlements(uid),
  ]);
  const v = one(video, 'Video');
  if (!canAccess(ent, v.chapters.subjects.grade_id, 'videos', v.is_free)) throw lockedError();

  const position = Math.round(Math.min(body.position_seconds, v.duration_seconds || body.position_seconds));
  // Count as finished in the last 15 seconds, so the credits don't keep it in "continue watching".
  const completed =
    body.completed === true || (v.duration_seconds > 0 && position >= v.duration_seconds - 15);

  const existing = maybe(
    await db.from('video_progress').select('video_id').eq('user_id', uid).eq('video_id', videoId).maybeSingle(),
  );
  ok(
    await db.from('video_progress').upsert(
      { user_id: uid, video_id: videoId, position_seconds: position, completed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,video_id' },
    ),
  );
  if (!existing) {
    const { error } = await db.rpc('increment_video_views', { p_video_id: videoId });
    if (error) console.warn('increment_video_views failed', error.message);
  }
  res.json({ position_seconds: position, completed });
});

