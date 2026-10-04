// Builds supabase/seed.sql (+ per-grade chunks in supabase/seed/) from supabase/seed-data/*.json.
// IDs are derived from content keys, so re-running the SQL updates rows instead of duplicating them.
// Usage: npm run seed:build  (prints checksums to compare against the database after applying)
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const supabaseDir = new URL('../../supabase/', import.meta.url);
const readJson = (name) => JSON.parse(readFileSync(new URL(`seed-data/${name}`, supabaseDir), 'utf8'));

// ---------------------------------------------------------------- helpers
const md5 = (s) => createHash('md5').update(s).digest('hex');
/** Deterministic v4-shaped UUID from a stable key. */
const uuid = (key) => {
  const h = md5(`kuraz:${key}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) % 4]}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const lit = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `array[${v.map(lit).join(', ')}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const jsonb = (v) => `${lit(JSON.stringify(v))}::jsonb`;

function upsert(table, columns, rows, conflict = ['id']) {
  if (rows.length === 0) return '';
  const updates = columns.filter((c) => !conflict.includes(c)).map((c) => `${c} = excluded.${c}`);
  const values = rows.map((r) => `  (${columns.map((c) => r[c]).join(', ')})`).join(',\n');
  return `insert into public.${table} (${columns.join(', ')}) values\n${values}\non conflict (${conflict.join(', ')}) do update set ${updates.join(', ')};\n`;
}

// ---------------------------------------------------------------- fixed data
const GRADES = [9, 10, 11, 12];
const SUBJECT_STYLE = {
  math: { icon: 'math', color: '#5B6CFF' },
  english: { icon: 'english', color: '#F59E0B' },
  physics: { icon: 'physics', color: '#0EA5E9' },
  chemistry: { icon: 'chemistry', color: '#10B981' },
  biology: { icon: 'biology', color: '#EC4899' },
};
// Placeholder lesson media (HEAD-checked public sample videos; replace with real lessons).
const VIDEO_POOL = [
  { url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4', seconds: 596 },
  { url: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4', seconds: 654 },
  { url: 'https://storage.googleapis.com/exoplayer-test-media-0/BigBuckBunny_320x180.mp4', seconds: 596 },
  { url: 'https://archive.org/download/Sintel/sintel-2048-surround_512kb.mp4', seconds: 888 },
];
const PACKAGE_PRICES = { 9: [299, 549], 10: [349, 649], 11: [399, 749], 12: [499, 999] };
const MOCK_DATES = ['2026-09-15', '2026-10-01', '2026-11-01', '2026-12-01'];

const QUESTION_COLUMNS = ['id', 'subject_id', 'chapter_id', 'stem', 'options', 'correct_option', 'explanation', 'difficulty', 'is_free', 'sort'];
const TEST_COLUMNS = ['id', 'grade_id', 'subject_id', 'type', 'title', 'description', 'exam_year', 'year_label', 'duration_minutes', 'is_free', 'scheduled_for', 'sort'];
const options = (texts) => texts.map((text, i) => ({ key: 'ABCD'[i], text }));
const viewCount = (key) => 120 + (parseInt(md5(key).slice(0, 6), 16) % 4800);

// ---------------------------------------------------------------- build
const chunks = [];
const all = { subjects: [], chapters: [], videos: [], questions: [], tests: [], test_questions: [] };

{
  const grades = GRADES.map((g) => ({ id: g, name: lit(`Grade ${g}`), sort: g - 8 }));
  const packages = GRADES.flatMap((g) => {
    const [basic, premium] = PACKAGE_PRICES[g];
    return [
      {
        id: lit(uuid(`pkg:${g}:basic`)), grade_id: g, name: lit('Basic'), tier: lit('basic'),
        description: lit(`Every Grade ${g} video lesson and the full question bank.`),
        features: lit(['All video lessons', 'Full question bank', 'Step-by-step explanations']),
        price_etb: basic, duration_days: 180, includes_videos: true, includes_qbank: true, includes_tests: false,
        is_active: true, sort: 1,
      },
      {
        id: lit(uuid(`pkg:${g}:premium`)), grade_id: g, name: lit('Premium'), tier: lit('premium'),
        description: lit(`Everything in Basic plus ${g === 12 ? 'past national exams, ' : ''}mock and unit tests for a full year.`),
        features: lit([
          'Everything in Basic',
          ...(g === 12 ? ['Past national exam papers'] : []),
          'Timed mock & unit tests',
          'Detailed results and review',
        ]),
        price_etb: premium, duration_days: 365, includes_videos: true, includes_qbank: true, includes_tests: true,
        is_active: true, sort: 2,
      },
    ];
  });
  chunks.push({
    name: '01_reference',
    sql:
      upsert('grades', ['id', 'name', 'sort'], grades) +
      upsert('packages', ['id', 'grade_id', 'name', 'tier', 'description', 'features', 'price_etb', 'duration_days', 'includes_videos', 'includes_qbank', 'includes_tests', 'is_active', 'sort'], packages),
  });
}

let videoCounter = 0;
for (const g of GRADES) {
  const data = readJson(`grade-${String(g).padStart(2, '0')}.json`);
  if (data.grade !== g) throw new Error(`grade-${g}.json has grade ${data.grade}`);
  const subjects = [], chapters = [], videos = [], questions = [], tests = [], testQuestions = [];
  const qbankBySubject = new Map();

  data.subjects.forEach((s, si) => {
    const subjectId = uuid(`${g}:${s.key}`);
    subjects.push({
      id: lit(subjectId), grade_id: g, name: lit(s.name), icon: lit(SUBJECT_STYLE[s.key].icon),
      color: lit(SUBJECT_STYLE[s.key].color), teacher_name: lit(s.teacher_name), teacher_avatar_url: 'null', sort: si + 1,
    });
    const subjectQuestions = [];
    s.chapters.forEach((c, ci) => {
      const chapterId = uuid(`${g}:${s.key}:${ci}`);
      chapters.push({ id: lit(chapterId), subject_id: lit(subjectId), title: lit(c.title), sort: ci + 1 });
      c.videos.forEach((v, vi) => {
        const id = uuid(`${g}:${s.key}:${ci}:v${vi}`);
        const media = VIDEO_POOL[videoCounter++ % VIDEO_POOL.length];
        videos.push({
          id: lit(id), chapter_id: lit(chapterId), title: lit(v.title), description: lit(v.description),
          duration_seconds: media.seconds, thumbnail_url: 'null', source_url: lit(media.url), notes_url: 'null',
          is_free: ci === 0 && vi < 2, view_count: viewCount(id), sort: vi + 1,
        });
      });
      c.questions.forEach((q, qi) => {
        const id = uuid(`${g}:${s.key}:${ci}:q${qi}`);
        subjectQuestions.push(id);
        questions.push({
          id: lit(id), subject_id: lit(subjectId), chapter_id: lit(chapterId), stem: lit(q.stem), options: jsonb(options(q.options)),
          correct_option: lit(q.answer), explanation: lit(q.explanation), difficulty: q.difficulty, is_free: ci === 0, sort: qi + 1,
        });
      });
    });
    qbankBySubject.set(s.key, { id: subjectId, name: s.name, questions: subjectQuestions });

    // Unit test per subject: the subject's QBank questions (first one free).
    const unitId = uuid(`${g}:${s.key}:unit`);
    tests.push({
      id: lit(unitId), grade_id: g, subject_id: lit(subjectId), type: lit('unit'), title: lit(`${s.name} Unit Test`),
      description: lit(`Covers ${s.chapters.map((c) => c.title).join(', ')}.`), exam_year: 'null', year_label: 'null',
      duration_minutes: 15, is_free: si === 0, scheduled_for: 'null', sort: si + 1,
    });
    subjectQuestions.slice(0, 10).forEach((qid, pos) =>
      testQuestions.push({ test_id: lit(unitId), question_id: lit(qid), position: pos + 1 }),
    );
  });

  // Monthly mock tests mixing two questions from every subject.
  MOCK_DATES.forEach((date, k) => {
    const mockId = uuid(`${g}:mock:${k}`);
    tests.push({
      id: lit(mockId), grade_id: g, subject_id: 'null', type: lit('mock'), title: lit(`Grade ${g} Mock Test ${k + 1}`),
      description: lit('Mixed questions from every subject, timed like the real exam.'), exam_year: 'null', year_label: 'null',
      duration_minutes: 15, is_free: k === 0, scheduled_for: lit(date), sort: k + 1,
    });
    let pos = 0;
    for (const { questions: qs } of qbankBySubject.values()) {
      for (const offset of [0, 1]) {
        testQuestions.push({ test_id: lit(mockId), question_id: lit(qs[(k * 2 + offset) % qs.length]), position: ++pos });
      }
    }
  });

  // Past national exam papers (Grade 12 only); their questions are not in the QBank.
  const nationalTests = [], nationalQuestions = [], nationalLinks = [];
  if (g === 12) {
    const { papers } = readJson('national-exams.json');
    papers.forEach((p, pi) => {
      const subject = qbankBySubject.get(p.subject_key);
      const testId = uuid(`12:national:${p.exam_year}:${p.subject_key}`);
      nationalTests.push({
        id: lit(testId), grade_id: 12, subject_id: lit(subject.id), type: lit('national'), title: lit(p.title),
        description: lit(`Practice paper in the style of the ${p.year_label} Grade 12 national exam (${subject.name}).`),
        exam_year: p.exam_year, year_label: lit(p.year_label), duration_minutes: p.duration_minutes, is_free: pi === 0,
        scheduled_for: 'null', sort: pi + 1,
      });
      p.questions.forEach((q, qi) => {
        const qid = uuid(`12:national:${p.exam_year}:${p.subject_key}:q${qi}`);
        nationalQuestions.push({
          id: lit(qid), subject_id: lit(subject.id), chapter_id: 'null', stem: lit(q.stem), options: jsonb(options(q.options)),
          correct_option: lit(q.answer), explanation: lit(q.explanation), difficulty: q.difficulty, is_free: false, sort: qi + 1,
        });
        nationalLinks.push({ test_id: lit(testId), question_id: lit(qid), position: qi + 1 });
      });
    });
  }

  const contentSql = (qs, ts, links) =>
    upsert('questions', QUESTION_COLUMNS, qs) + upsert('tests', TEST_COLUMNS, ts) +
    upsert('test_questions', ['test_id', 'question_id', 'position'], links, ['test_id', 'question_id']);
  chunks.push({
    name: `${String(g - 7).padStart(2, '0')}_grade${String(g).padStart(2, '0')}`,
    sql:
      upsert('subjects', ['id', 'grade_id', 'name', 'icon', 'color', 'teacher_name', 'teacher_avatar_url', 'sort'], subjects) +
      upsert('chapters', ['id', 'subject_id', 'title', 'sort'], chapters) +
      // view_count is left alone on re-runs so real views are kept.
      upsert('videos', ['id', 'chapter_id', 'title', 'description', 'duration_seconds', 'thumbnail_url', 'source_url', 'notes_url', 'is_free', 'view_count', 'sort'], videos)
        .replace(', view_count = excluded.view_count', '') +
      contentSql(questions, tests, testQuestions),
  });
  if (nationalTests.length) chunks.push({ name: '06_national_exams', sql: contentSql(nationalQuestions, nationalTests, nationalLinks) });
  for (const [k, list] of Object.entries({
    subjects, chapters, videos,
    questions: [...questions, ...nationalQuestions],
    tests: [...tests, ...nationalTests],
    test_questions: [...testQuestions, ...nationalLinks],
  })) {
    all[k].push(...list);
  }
}

// ---------------------------------------------------------------- write
const seedDir = new URL('seed/', supabaseDir);
mkdirSync(seedDir, { recursive: true });
const header = '-- Generated by backend/scripts/build-seed.mjs from supabase/seed-data/*.json. Do not edit by hand.\n';
for (const c of chunks) writeFileSync(new URL(`${c.name}.sql`, seedDir), header + c.sql);
writeFileSync(new URL('seed.sql', supabaseDir), header + chunks.map((c) => `-- ${c.name}\n${c.sql}`).join('\n'));

// Checksums to compare with the database (see README "Seeding").
const unquote = (s) => (s === 'null' ? null : s.slice(1, -1).replace(/''/g, "'"));
const questionDigest = md5(
  all.questions
    .map((q) => ({ id: unquote(q.id), text: `${unquote(q.stem)}|${unquote(q.correct_option)}|${unquote(q.explanation)}` }))
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((q) => `${q.id}|${q.text}`)
    .join('\n'),
);
console.log(
  JSON.stringify(
    {
      files: chunks.map((c) => `supabase/seed/${c.name}.sql (${(c.sql.length / 1024).toFixed(1)} KB)`),
      counts: Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.length])),
      question_md5: questionDigest,
    },
    null,
    2,
  ),
);
