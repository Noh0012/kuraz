import { Router } from 'express';
import { z } from 'zod';
import type {
  AttemptResult,
  AttemptSession,
  QuestionOption,
  TestCard,
  TestDetail,
  TestSection,
  TestsList,
  TestType,
} from '../contracts.js';
import type { Tables } from '../db/types.js';
import { userId } from '../middleware/auth.js';
import { HttpError, lockedError, maybe, one, rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { canAccess, loadEntitlements, type Entitlements } from '../services/entitlements.js';
import { getProfile, requireGrade } from '../services/profile.js';
import { addisDate } from '../services/qotd.js';
import { parseOptions } from '../services/questions.js';
import {
  asAnswerMap,
  isPastDeadline,
  mergeAnswers,
  scoreAnswers,
  SUBMIT_GRACE_MS,
  type ScorableQuestion,
} from '../services/scoring.js';

export const testRoutes = Router();

const uuid = z.uuid();
const typeSchema = z.enum(['national', 'mock', 'unit']);

export const TEST_SELECT =
  'id, type, title, description, exam_year, year_label, duration_minutes, is_free, scheduled_for, sort, grade_id, subjects(name, sort), test_questions(count)' as const;

interface TestRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  exam_year: number | null;
  year_label: string | null;
  duration_minutes: number;
  is_free: boolean;
  scheduled_for: string | null;
  sort: number;
  grade_id: number;
  subjects: { name: string; sort: number } | null;
  test_questions: { count: number }[];
}

type AttemptRow = Tables<'test_attempts'>;

export function toTestCard(t: TestRow, ent: Entitlements, today: string, attempts: AttemptRow[]): TestCard {
  const submitted = attempts.filter((a) => a.submitted_at && a.score != null && a.total);
  const best = submitted.reduce<AttemptRow | null>(
    (b, a) => (!b || a.score! / a.total! > b.score! / b.total! ? a : b),
    null,
  );
  return {
    id: t.id,
    type: t.type as TestType,
    title: t.title,
    subject_name: t.subjects?.name ?? null,
    year_label: t.year_label,
    question_count: t.test_questions[0]?.count ?? 0,
    duration_minutes: t.duration_minutes,
    is_free: t.is_free,
    locked: !canAccess(ent, t.grade_id, 'tests', t.is_free),
    opens_on: t.scheduled_for && t.scheduled_for > today ? t.scheduled_for : null,
    best: best ? { score: best.score!, total: best.total! } : null,
    open_attempt_id: attempts.find((a) => !a.submitted_at)?.id ?? null,
  };
}

function monthLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Past exams by year (newest first), mock tests by month, unit tests by subject. */
export function groupTests(type: TestType, tests: TestRow[], cards: Map<string, TestCard>): TestSection[] {
  const sorted = [...tests].sort((a, b) => {
    if (type === 'national') return (b.exam_year ?? 0) - (a.exam_year ?? 0) || a.sort - b.sort;
    if (type === 'mock') return (a.scheduled_for ?? '9999').localeCompare(b.scheduled_for ?? '9999') || a.sort - b.sort;
    return (a.subjects?.sort ?? 99) - (b.subjects?.sort ?? 99) || a.sort - b.sort;
  });
  const sections = new Map<string, TestCard[]>();
  for (const t of sorted) {
    const title =
      type === 'national'
        ? (t.year_label ?? 'Other years')
        : type === 'mock'
          ? t.scheduled_for
            ? monthLabel(t.scheduled_for)
            : 'Anytime'
          : (t.subjects?.name ?? 'General');
    const list = sections.get(title) ?? [];
    list.push(cards.get(t.id)!);
    sections.set(title, list);
  }
  return [...sections].map(([title, list]) => ({ title, tests: list }));
}

async function attemptsFor(uid: string, testIds: string[]): Promise<Map<string, AttemptRow[]>> {
  const map = new Map<string, AttemptRow[]>();
  if (testIds.length === 0) return map;
  const data = rows(
    await db
      .from('test_attempts')
      .select('*')
      .eq('user_id', uid)
      .in('test_id', testIds)
      .order('started_at', { ascending: false }),
  );
  for (const a of data) map.set(a.test_id, [...(map.get(a.test_id) ?? []), a]);
  return map;
}

interface TestQuestion extends ScorableQuestion {
  stem: string;
  options: QuestionOption[];
  explanation: string | null;
}

async function loadTestQuestions(testId: string): Promise<TestQuestion[]> {
  const data = rows(
    await db
      .from('test_questions')
      .select('position, questions!inner(id, stem, options, correct_option, explanation)')
      .eq('test_id', testId)
      .order('position'),
  );
  return data.map(({ questions: q }) => {
    const options = parseOptions(q.options);
    return {
      id: q.id,
      stem: q.stem,
      options,
      optionKeys: options.map((o) => o.key),
      correct_option: q.correct_option,
      explanation: q.explanation,
    };
  });
}

async function loadOwnAttempt(uid: string, attemptId: string): Promise<AttemptRow> {
  const attempt = one(await db.from('test_attempts').select('*').eq('id', attemptId).maybeSingle(), 'Attempt');
  if (attempt.user_id !== uid) throw new HttpError(404, 'not_found', 'Attempt not found');
  return attempt;
}

/** Scores and closes an attempt. Answers sent after the deadline (plus grace) are ignored. */
async function finalizeAttempt(
  attempt: AttemptRow,
  questions: TestQuestion[],
  incoming: Record<string, string | null> | null,
  now = new Date(),
): Promise<AttemptRow> {
  const late = isPastDeadline(attempt.deadline_at, now);
  const answers = mergeAnswers(asAnswerMap(attempt.answers), late || !incoming ? {} : incoming, questions);
  const { score, total } = scoreAnswers(questions, answers);
  const updated = maybe(
    await db
      .from('test_attempts')
      .update({ answers, score, total, submitted_at: now.toISOString() })
      .eq('id', attempt.id)
      .is('submitted_at', null)
      .select('*')
      .maybeSingle(),
  );
  // A concurrent submit won the race: return what it stored.
  return updated ?? one(await db.from('test_attempts').select('*').eq('id', attempt.id).maybeSingle(), 'Attempt');
}

function toResult(attempt: AttemptRow, test: { id: string; title: string; type: string }, questions: TestQuestion[]) {
  const answers = asAnswerMap(attempt.answers);
  const submittedAt = attempt.submitted_at ?? new Date().toISOString();
  const body: AttemptResult = {
    id: attempt.id,
    test: { id: test.id, title: test.title, type: test.type as TestType },
    started_at: attempt.started_at,
    submitted_at: submittedAt,
    score: attempt.score ?? 0,
    total: attempt.total ?? questions.length,
    late: Date.parse(submittedAt) > Date.parse(attempt.deadline_at) + SUBMIT_GRACE_MS,
    review: questions.map((q) => ({
      question_id: q.id,
      stem: q.stem,
      options: q.options,
      selected_option: answers[q.id] ?? null,
      correct_option: q.correct_option,
      explanation: q.explanation,
      is_correct: answers[q.id] === q.correct_option,
    })),
  };
  return body;
}

testRoutes.get('/tests', async (req, res) => {
  const uid = userId(req);
  const type = typeSchema.parse(req.query.type ?? 'national');
  const [profile, ent] = await Promise.all([getProfile(uid), loadEntitlements(uid)]);
  const gradeId = requireGrade(profile);

  const tests: TestRow[] = rows(await db.from('tests').select(TEST_SELECT).eq('grade_id', gradeId).eq('type', type));
  const attempts = await attemptsFor(uid, tests.map((t) => t.id));
  const today = addisDate();
  const cards = new Map(tests.map((t) => [t.id, toTestCard(t, ent, today, attempts.get(t.id) ?? [])]));

  const body: TestsList = { type, sections: groupTests(type, tests, cards) };
  res.json(body);
});

testRoutes.get('/tests/:id', async (req, res) => {
  const uid = userId(req);
  const testId = uuid.parse(req.params.id);
  const [test, ent, attempts] = await Promise.all([
    db.from('tests').select(TEST_SELECT).eq('id', testId).maybeSingle(),
    loadEntitlements(uid),
    attemptsFor(uid, [testId]),
  ]);
  const t: TestRow = one(test, 'Test');
  const mine = attempts.get(testId) ?? [];
  const body: TestDetail = {
    ...toTestCard(t, ent, addisDate(), mine),
    description: t.description,
    attempts: mine.map((a) => ({
      id: a.id,
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      score: a.score,
      total: a.total,
    })),
  };
  res.json(body);
});

/** Starts a new attempt, or resumes the open one if its clock is still running. */
testRoutes.post('/tests/:id/attempts', async (req, res) => {
  const uid = userId(req);
  const testId = uuid.parse(req.params.id);
  const [test, ent] = await Promise.all([
    db.from('tests').select('id, title, grade_id, is_free, duration_minutes, scheduled_for').eq('id', testId).maybeSingle(),
    loadEntitlements(uid),
  ]);
  const t = one(test, 'Test');
  if (!canAccess(ent, t.grade_id, 'tests', t.is_free)) throw lockedError();
  if (t.scheduled_for && t.scheduled_for > addisDate()) {
    throw new HttpError(409, 'not_available', `This test opens on ${t.scheduled_for}`);
  }

  const questions = await loadTestQuestions(testId);
  if (questions.length === 0) throw new HttpError(409, 'not_available', 'This test has no questions yet');

  const findOpen = async (): Promise<AttemptRow | null> =>
    maybe(
      await db
        .from('test_attempts')
        .select('*')
        .eq('user_id', uid)
        .eq('test_id', testId)
        .is('submitted_at', null)
        .maybeSingle(),
    );

  const now = new Date();
  let attempt = await findOpen();
  if (attempt && isPastDeadline(attempt.deadline_at, now)) {
    await finalizeAttempt(attempt, questions, null, now);
    attempt = null;
  }
  if (!attempt) {
    const inserted = await db
      .from('test_attempts')
      .insert({
        user_id: uid,
        test_id: testId,
        started_at: now.toISOString(),
        deadline_at: new Date(now.getTime() + t.duration_minutes * 60_000).toISOString(),
      })
      .select('*')
      .single();
    // 23505: a parallel request opened one first (unique index on open attempts).
    if (inserted.error?.code === '23505') attempt = await findOpen();
    else if (inserted.error) throw new HttpError(500, 'db_error', inserted.error.message);
    else attempt = inserted.data;
  }
  if (!attempt) throw new HttpError(500, 'internal', 'Could not start the test');

  const body: AttemptSession = {
    attempt: {
      id: attempt.id,
      test_id: testId,
      started_at: attempt.started_at,
      deadline_at: attempt.deadline_at,
      answers: asAnswerMap(attempt.answers),
    },
    test: { id: t.id, title: t.title, duration_minutes: t.duration_minutes },
    questions: questions.map((q) => ({ id: q.id, stem: q.stem, options: q.options })),
    server_time: new Date().toISOString(),
  };
  res.status(201).json(body);
});

const answersSchema = z.object({
  answers: z.record(z.string(), z.string().max(4).nullable()),
});

testRoutes.put('/attempts/:id/answers', async (req, res) => {
  const uid = userId(req);
  const attemptId = uuid.parse(req.params.id);
  const { answers: incoming } = answersSchema.parse(req.body);
  const attempt = await loadOwnAttempt(uid, attemptId);
  if (attempt.submitted_at) throw new HttpError(409, 'already_submitted', 'This attempt was already submitted');
  if (isPastDeadline(attempt.deadline_at)) throw new HttpError(409, 'deadline_passed', 'Time is up for this attempt');

  const questions = await loadTestQuestions(attempt.test_id);
  const answers = mergeAnswers(asAnswerMap(attempt.answers), incoming, questions);
  const saved = maybe(
    await db
      .from('test_attempts')
      .update({ answers })
      .eq('id', attemptId)
      .is('submitted_at', null)
      .select('id')
      .maybeSingle(),
  );
  if (!saved) throw new HttpError(409, 'already_submitted', 'This attempt was already submitted');
  res.json({ saved: Object.keys(answers).length });
});

const submitSchema = z.object({
  answers: z.record(z.string(), z.string().max(4).nullable()).optional(),
});

testRoutes.post('/attempts/:id/submit', async (req, res) => {
  const uid = userId(req);
  const attemptId = uuid.parse(req.params.id);
  const { answers } = submitSchema.parse(req.body ?? {});
  let attempt = await loadOwnAttempt(uid, attemptId);
  const [questions, test] = await Promise.all([
    loadTestQuestions(attempt.test_id),
    db.from('tests').select('id, title, type').eq('id', attempt.test_id).maybeSingle(),
  ]);
  if (!attempt.submitted_at) attempt = await finalizeAttempt(attempt, questions, answers ?? null);
  res.json(toResult(attempt, one(test, 'Test'), questions));
});

testRoutes.get('/attempts/:id', async (req, res) => {
  const uid = userId(req);
  const attemptId = uuid.parse(req.params.id);
  let attempt = await loadOwnAttempt(uid, attemptId);
  const [questions, test] = await Promise.all([
    loadTestQuestions(attempt.test_id),
    db.from('tests').select('id, title, type').eq('id', attempt.test_id).maybeSingle(),
  ]);
  if (!attempt.submitted_at) {
    // The review (with answers) only exists once the attempt is closed.
    if (!isPastDeadline(attempt.deadline_at)) {
      throw new HttpError(409, 'in_progress', 'Finish the test to see the results');
    }
    attempt = await finalizeAttempt(attempt, questions, null);
  }
  res.json(toResult(attempt, one(test, 'Test'), questions));
});
