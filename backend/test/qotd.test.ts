import { describe, expect, it } from 'vitest';
import { addisDate, pickIndex } from '../src/services/qotd.js';

describe('question of the day', () => {
  it('uses the Addis Ababa calendar day (UTC+3)', () => {
    expect(addisDate(new Date('2026-10-04T20:59:00Z'))).toBe('2026-10-04');
    expect(addisDate(new Date('2026-10-04T21:00:00Z'))).toBe('2026-10-05');
  });

  it('is the same for every student of a grade on a given day', () => {
    expect(pickIndex('2026-10-04', 12, 75)).toBe(pickIndex('2026-10-04', 12, 75));
  });

  it('changes from day to day and between grades', () => {
    const week = ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map((d) => pickIndex(d, 12, 75));
    expect(new Set(week).size).toBeGreaterThan(1);
    const grades = [9, 10, 11, 12].map((g) => pickIndex('2026-10-04', g, 75));
    expect(new Set(grades).size).toBeGreaterThan(1);
  });

  it('stays in range and handles an empty pool', () => {
    for (let day = 1; day <= 28; day++) {
      const i = pickIndex(`2026-02-${String(day).padStart(2, '0')}`, 9, 40);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(40);
    }
    expect(pickIndex('2026-10-04', 12, 0)).toBe(-1);
  });
});
