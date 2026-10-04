import { describe, expect, it } from 'vitest';
import { asAnswerMap, isPastDeadline, mergeAnswers, scoreAnswers } from '../src/services/scoring.js';

const questions = [
  { id: 'q1', correct_option: 'A', optionKeys: ['A', 'B', 'C', 'D'] },
  { id: 'q2', correct_option: 'C', optionKeys: ['A', 'B', 'C', 'D'] },
  { id: 'q3', correct_option: 'D', optionKeys: ['A', 'B', 'C', 'D'] },
];

describe('scoring', () => {
  it('scores a hand-checked attempt', () => {
    const { score, total, results } = scoreAnswers(questions, { q1: 'A', q2: 'B' });
    expect(score).toBe(1);
    expect(total).toBe(3);
    expect(results.map((r) => r.is_correct)).toEqual([true, false, false]);
    expect(results[2].selected_option).toBeNull();
  });

  it('merges autosaves, drops unknown questions and options, and clears with null', () => {
    const merged = mergeAnswers({ q1: 'A', q2: 'B' }, { q2: null, q3: 'D', q9: 'A', q1: 'Z' }, questions);
    expect(merged).toEqual({ q1: 'A', q3: 'D' });
  });

  it('applies a grace period to the deadline', () => {
    const deadline = '2026-10-04T10:00:00.000Z';
    expect(isPastDeadline(deadline, new Date('2026-10-04T10:00:20Z'))).toBe(false);
    expect(isPastDeadline(deadline, new Date('2026-10-04T10:00:31Z'))).toBe(true);
  });

  it('only accepts string answers from stored JSON', () => {
    expect(asAnswerMap({ q1: 'A', q2: 3, q3: null })).toEqual({ q1: 'A' });
    expect(asAnswerMap(['A'])).toEqual({});
    expect(asAnswerMap(null)).toEqual({});
  });
});
