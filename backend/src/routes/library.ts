import { Router } from 'express';
import { z } from 'zod';
import type { BookmarkedQuestion, Bookmarks, SearchResults } from '../contracts.js';
import { userId } from '../middleware/auth.js';
import { HttpError, maybe, ok, rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { progressFor, toSubjectLite, toVideoCard, VIDEO_CARD_SELECT } from '../services/catalog.js';
import { canAccess, loadEntitlements } from '../services/entitlements.js';
import { getProfile, requireGrade } from '../services/profile.js';
import { addisDate } from '../services/qotd.js';
import { toPublicQuestion } from '../services/questions.js';
import { TEST_SELECT, toTestCard } from './tests.js';

export const libraryRoutes = Router();

const itemType = z.enum(['video', 'question']);
const uuid = z.uuid();

libraryRoutes.get('/bookmarks', async (req, res) => {
  const uid = userId(req);
  const [marks, ent] = await Promise.all([
    db
      .from('bookmarks')
      .select('item_type, item_id')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(300),
    loadEntitlements(uid),
  ]);
  const list = rows(marks);
  const videoIds = list.filter((m) => m.item_type === 'video').map((m) => m.item_id);
  const questionIds = list.filter((m) => m.item_type === 'question').map((m) => m.item_id);

  const [videos, questions, attempts, progress] = await Promise.all([
    videoIds.length
      ? db.from('videos').select(VIDEO_CARD_SELECT).in('id', videoIds)
      : Promise.resolve({ data: [], error: null }),
    questionIds.length
      ? db
          .from('questions')
          .select(
            'id, stem, options, difficulty, correct_option, explanation, chapters(id, title), subjects!inner(id, name, icon, color, teacher_name, teacher_avatar_url)',
          )
          .in('id', questionIds)
      : Promise.resolve({ data: [], error: null }),
    questionIds.length
      ? db
          .from('question_attempts')
          .select('question_id, selected_option, is_correct')
          .eq('user_id', uid)
          .in('question_id', questionIds)
      : Promise.resolve({ data: [], error: null }),
    progressFor(uid, videoIds),
  ]);

  const videoById = new Map(rows(videos).map((v) => [v.id, v]));
  const questionById = new Map(rows(questions).map((q) => [q.id, q]));
  const attemptById = new Map(rows(attempts).map((a) => [a.question_id, a]));

  const body: Bookmarks = {
    videos: videoIds.flatMap((id) => {
      const v = videoById.get(id);
      return v ? [toVideoCard(v, ent, progress.get(id) ?? null)] : [];
    }),
    questions: questionIds.flatMap((id): BookmarkedQuestion[] => {
      const q = questionById.get(id);
      if (!q) return [];
      return [
        {
          ...toPublicQuestion(q, attemptById.get(id) ?? null, true),
          subject: toSubjectLite(q.subjects),
          chapter: q.chapters ? { id: q.chapters.id, title: q.chapters.title } : null,
        },
      ];
    }),
  };
  res.json(body);
});

const bookmarkSchema = z.object({ item_type: itemType, item_id: uuid });

libraryRoutes.post('/bookmarks', async (req, res) => {
  const uid = userId(req);
  const { item_type, item_id } = bookmarkSchema.parse(req.body);
  const exists =
    item_type === 'video'
      ? maybe(await db.from('videos').select('id').eq('id', item_id).maybeSingle())
      : maybe(await db.from('questions').select('id').eq('id', item_id).not('chapter_id', 'is', null).maybeSingle());
  if (!exists) throw new HttpError(404, 'not_found', 'Item not found');

  ok(
    await db
      .from('bookmarks')
      .upsert({ user_id: uid, item_type, item_id }, { onConflict: 'user_id,item_type,item_id', ignoreDuplicates: true }),
  );
  res.status(201).json({ bookmarked: true });
});

libraryRoutes.delete('/bookmarks/:type/:id', async (req, res) => {
  const uid = userId(req);
  const type = itemType.parse(req.params.type);
  const id = uuid.parse(req.params.id);
  ok(await db.from('bookmarks').delete().eq('user_id', uid).eq('item_type', type).eq('item_id', id));
  res.status(204).end();
});

/** Escapes LIKE wildcards so the query is matched literally. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const searchSchema = z.object({
  q: z.string().trim().min(2, 'Type at least 2 characters').max(60),
  scope: z.enum(['all', 'videos', 'qbank', 'tests']).default('all'),
});

libraryRoutes.get('/search', async (req, res) => {
  const uid = userId(req);
  const { q, scope } = searchSchema.parse(req.query);
  const [profile, ent] = await Promise.all([getProfile(uid), loadEntitlements(uid)]);
  const gradeId = requireGrade(profile);
  const pattern = likePattern(q);
  const want = (s: string) => scope === 'all' || scope === s;
  const empty = Promise.resolve({ data: [], error: null });

  const [byTitle, byChapter, chapters, tests] = await Promise.all([
    want('videos')
      ? db.from('videos').select(VIDEO_CARD_SELECT).eq('chapters.subjects.grade_id', gradeId).ilike('title', pattern).limit(20)
      : empty,
    want('videos')
      ? db
          .from('videos')
          .select(VIDEO_CARD_SELECT)
          .eq('chapters.subjects.grade_id', gradeId)
          .ilike('chapters.title', pattern)
          .limit(20)
      : empty,
    want('qbank')
      ? db
          .from('chapters')
          .select('id, title, subjects!inner(id, name, icon, color, teacher_name, teacher_avatar_url, grade_id), questions(id, is_free)')
          .eq('subjects.grade_id', gradeId)
          .ilike('title', pattern)
          .limit(20)
      : empty,
    want('tests')
      ? db.from('tests').select(TEST_SELECT).eq('grade_id', gradeId).ilike('title', pattern).limit(20)
      : empty,
  ]);

  const seen = new Set<string>();
  const videoRows = [...rows(byTitle), ...rows(byChapter)].filter((v) => !seen.has(v.id) && seen.add(v.id));
  const progress = await progressFor(uid, videoRows.map((v) => v.id));
  const today = addisDate();

  const body: SearchResults = {
    videos: videoRows.map((v) => toVideoCard(v, ent, progress.get(v.id) ?? null)),
    chapters: rows(chapters)
      .filter((c) => c.questions.length > 0)
      .map((c) => ({
        id: c.id,
        title: c.title,
        subject: toSubjectLite(c.subjects),
        question_count: c.questions.length,
        locked: !c.questions.every((x) => canAccess(ent, gradeId, 'qbank', x.is_free)),
      })),
    tests: rows(tests).map((t) => toTestCard(t, ent, today, [])),
  };
  res.json(body);
});
