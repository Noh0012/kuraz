import { Router } from 'express';
import { z } from 'zod';
import type { AnswerReveal, ChapterQuestions, SubjectQbank } from '../contracts.js';
import { userId } from '../middleware/auth.js';
import { HttpError, lockedError, one, ok, rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { bookmarkedIds, toSubjectLite } from '../services/catalog.js';
import { canAccess, loadEntitlements } from '../services/entitlements.js';
import { getProfile, requireGrade } from '../services/profile.js';
import { questionOfTheDayId } from '../services/qotd.js';
import { parseOptions, toPublicQuestion } from '../services/questions.js';
import { loadQuestionOfTheDay } from './home.js';

export const qbankRoutes = Router();

const uuid = z.uuid();

/** A chapter is unlocked when all of its questions are free or the student has QBank access. */
qbankRoutes.get('/subjects/:id/qbank', async (req, res) => {
  const uid = userId(req);
  const subjectId = uuid.parse(req.params.id);
  const [subject, ent, attempts] = await Promise.all([
    db
      .from('subjects')
      .select(
        'id, name, icon, color, teacher_name, teacher_avatar_url, grade_id, chapters(id, title, sort, questions(id, is_free))',
      )
      .eq('id', subjectId)
      .maybeSingle(),
    loadEntitlements(uid),
    db
      .from('question_attempts')
      .select('question_id, is_correct, questions!inner(subject_id)')
      .eq('user_id', uid)
      .eq('questions.subject_id', subjectId),
  ]);
  const s = one(subject, 'Subject');
  const attemptMap = new Map(rows(attempts).map((a) => [a.question_id, a.is_correct]));

  const body: SubjectQbank = {
    subject: toSubjectLite(s),
    chapters: [...s.chapters]
      .sort((a, b) => a.sort - b.sort)
      .filter((c) => c.questions.length > 0)
      .map((c) => {
        const answered = c.questions.filter((q) => attemptMap.has(q.id));
        return {
          id: c.id,
          title: c.title,
          total: c.questions.length,
          answered: answered.length,
          correct: answered.filter((q) => attemptMap.get(q.id)).length,
          locked: !c.questions.every((q) => canAccess(ent, s.grade_id, 'qbank', q.is_free)),
        };
      }),
  };
  res.json(body);
});

qbankRoutes.get('/qbank/chapters/:id/questions', async (req, res) => {
  const uid = userId(req);
  const chapterId = uuid.parse(req.params.id);
  const [chapter, ent] = await Promise.all([
    db
      .from('chapters')
      .select(
        'id, title, subjects!inner(id, name, icon, color, teacher_name, teacher_avatar_url, grade_id), questions(id, stem, options, difficulty, correct_option, explanation, is_free, sort)',
      )
      .eq('id', chapterId)
      .maybeSingle(),
    loadEntitlements(uid),
  ]);
  const c = one(chapter, 'Chapter');
  const gradeId = c.subjects.grade_id;
  const visible = [...c.questions]
    .sort((a, b) => a.sort - b.sort)
    .filter((q) => canAccess(ent, gradeId, 'qbank', q.is_free));
  if (visible.length === 0 && c.questions.length > 0) throw lockedError();

  const ids = visible.map((q) => q.id);
  const [attempts, bookmarks] = await Promise.all([
    ids.length
      ? db.from('question_attempts').select('question_id, selected_option, is_correct').eq('user_id', uid).in('question_id', ids)
      : Promise.resolve({ data: [], error: null }),
    bookmarkedIds(uid, 'question', ids),
  ]);
  const attemptMap = new Map(rows(attempts).map((a) => [a.question_id, a]));

  const body: ChapterQuestions = {
    subject: toSubjectLite(c.subjects),
    chapter: { id: c.id, title: c.title },
    questions: visible.map((q) => toPublicQuestion(q, attemptMap.get(q.id) ?? null, bookmarks.has(q.id))),
  };
  res.json(body);
});

const answerSchema = z.object({ selected_option: z.string().min(1).max(4) });

/**
 * Checks a QBank answer. Exam-paper questions (no chapter) are never revealed here,
 * only in the review of a submitted test attempt.
 */
qbankRoutes.post('/questions/:id/answer', async (req, res) => {
  const uid = userId(req);
  const questionId = uuid.parse(req.params.id);
  const { selected_option } = answerSchema.parse(req.body);

  const [question, ent, profile] = await Promise.all([
    db
      .from('questions')
      .select('id, chapter_id, options, correct_option, explanation, is_free, subjects!inner(grade_id)')
      .eq('id', questionId)
      .maybeSingle(),
    loadEntitlements(uid),
    getProfile(uid),
  ]);
  const q = one(question, 'Question');
  if (!q.chapter_id) throw new HttpError(404, 'not_found', 'Question not found');

  const gradeId = q.subjects.grade_id;
  let allowed = canAccess(ent, gradeId, 'qbank', q.is_free);
  if (!allowed && profile.grade_id === gradeId) {
    allowed = (await questionOfTheDayId(gradeId)) === questionId; // today's free question
  }
  if (!allowed) throw lockedError();

  if (!parseOptions(q.options).some((o) => o.key === selected_option)) {
    throw new HttpError(400, 'invalid_request', 'Unknown option');
  }
  const isCorrect = selected_option === q.correct_option;
  ok(
    await db.from('question_attempts').upsert(
      {
        user_id: uid,
        question_id: questionId,
        selected_option,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,question_id' },
    ),
  );

  const body: AnswerReveal = {
    selected_option,
    is_correct: isCorrect,
    correct_option: q.correct_option,
    explanation: q.explanation,
  };
  res.json(body);
});

qbankRoutes.get('/qotd', async (req, res) => {
  const uid = userId(req);
  const profile = await getProfile(uid);
  const qotd = await loadQuestionOfTheDay(uid, requireGrade(profile));
  if (!qotd) throw new HttpError(404, 'not_found', 'No question today');
  res.json(qotd);
});
