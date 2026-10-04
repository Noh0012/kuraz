import { describe, expect, it } from 'vitest';
import { likePattern } from '../src/routes/library.js';
import { groupTests } from '../src/routes/tests.js';
import { parseOptions, toPublicQuestion } from '../src/services/questions.js';
import type { TestCard } from '../src/contracts.js';

const row = {
  id: 'q1',
  stem: 'What is 2 + 2?',
  options: [
    { key: 'A', text: '3' },
    { key: 'B', text: '4' },
  ],
  difficulty: 1,
  correct_option: 'B',
  explanation: '2 + 2 = 4',
};

describe('question sanitising', () => {
  it('never exposes the answer before the student answers', () => {
    const q = toPublicQuestion(row, null, false);
    const json = JSON.stringify(q);
    expect(json).not.toContain('correct_option');
    expect(json).not.toContain('explanation');
    expect(q.attempt).toBeNull();
  });

  it('reveals the answer and explanation after an attempt', () => {
    const q = toPublicQuestion(row, { selected_option: 'A', is_correct: false }, true);
    expect(q.attempt).toEqual({ selected_option: 'A', is_correct: false, correct_option: 'B', explanation: '2 + 2 = 4' });
    expect(q.bookmarked).toBe(true);
  });

  it('drops malformed options', () => {
    expect(parseOptions([{ key: 'A', text: 'x' }, { key: 1 }, 'B', null])).toEqual([{ key: 'A', text: 'x' }]);
    expect(parseOptions({ key: 'A' })).toEqual([]);
  });
});

describe('search', () => {
  it('escapes LIKE wildcards', () => {
    expect(likePattern('50%_off')).toBe('%50\\%\\_off%');
  });
});

describe('test sections', () => {
  const base = { description: null, duration_minutes: 30, is_free: false, grade_id: 12, test_questions: [{ count: 10 }] };
  const tests = [
    { ...base, id: 'a', type: 'national', title: 'Maths 2015', exam_year: 2015, year_label: '2015 E.C.', scheduled_for: null, sort: 1, subjects: null },
    { ...base, id: 'b', type: 'national', title: 'Maths 2016', exam_year: 2016, year_label: '2016 E.C.', scheduled_for: null, sort: 1, subjects: null },
    { ...base, id: 'c', type: 'national', title: 'Physics 2016', exam_year: 2016, year_label: '2016 E.C.', scheduled_for: null, sort: 2, subjects: null },
  ];
  const cards = new Map(tests.map((t) => [t.id, { id: t.id } as TestCard]));

  it('groups past exams by year, newest first', () => {
    const sections = groupTests('national', tests, cards);
    expect(sections.map((s) => s.title)).toEqual(['2016 E.C.', '2015 E.C.']);
    expect(sections[0].tests.map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('groups mock tests by month in date order', () => {
    const mocks = [
      { ...tests[0], id: 'm2', type: 'mock', scheduled_for: '2026-11-01' },
      { ...tests[0], id: 'm1', type: 'mock', scheduled_for: '2026-10-01' },
    ];
    const sections = groupTests('mock', mocks, new Map(mocks.map((t) => [t.id, { id: t.id } as TestCard])));
    expect(sections.map((s) => s.title)).toEqual(['October 2026', 'November 2026']);
  });
});
