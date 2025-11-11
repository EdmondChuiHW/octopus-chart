import { describe, it, expect } from 'vitest';
import { findLowestPeriod } from './priceUtils';

describe('findLowestPeriod', () => {
  it('returns -1 for non-positive targetLength or empty points', () => {
    expect(findLowestPeriod([1, 2, 3], (x) => x, 0)).toBe(-1);
    expect(findLowestPeriod([], (x) => x, 1)).toBe(-1);
    expect(findLowestPeriod([], (x) => x, 0)).toBe(-1);
  });

  it('returns 0 when points.length < targetLength', () => {
    expect(findLowestPeriod([1, 2], (x) => x, 3)).toBe(0);
  });

  it('finds the correct start index for a numeric array (basic sliding window)', () => {
    const arr = [5, 1, 2, 3, 4];
    expect(findLowestPeriod(arr, (x) => x, 2)).toBe(1);
  });

  it('returns 0 when targetLength equals array length', () => {
    expect(findLowestPeriod([9, 8, 7], (x) => x, 3)).toBe(0);
  });

  it('works with object arrays and an extractor function', () => {
    const points = [{ v: 10 }, { v: 1 }, { v: 2 }, { v: 3 }];
    expect(findLowestPeriod(points, (p) => p.v, 2)).toBe(1);
  });

  it('prefers the earliest index on ties', () => {
    const arr = [1, 2, 1, 2];
    expect(findLowestPeriod(arr, (x) => x, 2)).toBe(0);
  });

  it('handles negative values correctly', () => {
    const arr = [-1, -2, -3, -4];
    expect(findLowestPeriod(arr, (x) => x, 2)).toBe(2);
  });
});
