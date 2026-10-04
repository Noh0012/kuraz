import { Router } from 'express';
import type { HomeData, QuestionOfTheDay } from '../contracts.js';
import { userId } from '../middleware/auth.js';
import { maybe, rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import {
  bookmarkedIds,
  continueWatching,
  progressFor,
  toSubjectLite,
  toVideoCard,
  VIDEO_CARD_SELECT,
} from '../services/catalog.js';
import { bestPlan, loadEntitlements } from '../services/entitlements.js';
import { getProfile, requireGrade } from '../services/profile.js';
import { addisDate, questionOfTheDayId } from '../services/qotd.js';
import { toPublicQuestion } from '../services/questions.js';

export const homeRoutes = Router();

export async function loadQuestionOfTheDay(uid: string, gradeId: number): Promise<QuestionOfTheDay | null> {
  const qid = await questionOfTheDayId(gradeId);
  if (!qid) return null;
  const [question, attempt, bookmarks] = await Promise.all([
    db
      .from('questions')
      .select(
        'id, stem, options, difficulty, correct_option, explanation, subjects!inner(id, name, icon, color, teacher_name, teacher_avatar_url)',
      )
      .eq('id', qid)
      .maybeSingle(),
    db.from('question_attempts').select('selected_option, is_correct').eq('user_id', uid).eq('question_id', qid).maybeSingle(),
    bookmarkedIds(uid, 'question', [qid]),
  ]);
  const q = maybe(question);
  if (!q) return null;
  return {
    date: addisDate(),
    subject: toSubjectLite(q.subjects),
    question: toPublicQuestion(q, maybe(attempt), bookmarks.has(qid)),
  };
}

homeRoutes.get('/home', async (req, res) => {
  const uid = userId(req);
  const [profile, ent] = await Promise.all([getProfile(uid), loadEntitlements(uid)]);
  const gradeId = requireGrade(profile);

  const [mostWatched, cont, qotd, freeVideos, freeQuestions] = await Promise.all([
    db
      .from('videos')
      .select(VIDEO_CARD_SELECT)
      .eq('chapters.subjects.grade_id', gradeId)
      .order('view_count', { ascending: false })
      .order('sort')
      .limit(5),
    continueWatching(uid, gradeId, ent),
    loadQuestionOfTheDay(uid, gradeId),
    db
      .from('videos')
      .select('id, chapters!inner(subjects!inner(grade_id))', { count: 'exact', head: true })
      .eq('chapters.subjects.grade_id', gradeId)
      .eq('is_free', true),
    db
      .from('questions')
      .select('id, subjects!inner(grade_id)', { count: 'exact', head: true })
      .eq('subjects.grade_id', gradeId)
      .not('chapter_id', 'is', null)
      .eq('is_free', true),
  ]);

  const videos = rows(mostWatched);
  const progress = await progressFor(uid, videos.map((v) => v.id));
  const body: HomeData = {
    plan: bestPlan(ent, gradeId),
    most_watched: videos.map((v) => toVideoCard(v, ent, progress.get(v.id) ?? null)),
    continue_watching: cont,
    qotd,
    free: { videos: freeVideos.count ?? 0, questions: freeQuestions.count ?? 0 },
  };
  res.json(body);
});
