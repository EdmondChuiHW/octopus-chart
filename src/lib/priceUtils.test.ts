import { describe, it, expect } from 'vitest';
import {
  findLowestPeriod,
  computeWindowSums,
  findTopNCheapestPeriods,
} from './priceUtils';
describe('computeWindowSums', () => {
  it('computes window sums for a simple array', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = computeWindowSums(arr, (x) => x, 3);
    expect(result).toEqual([
      { startIndex: 0, sum: 6 }, // 1+2+3
      { startIndex: 1, sum: 9 }, // 2+3+4
      { startIndex: 2, sum: 12 }, // 3+4+5
    ]);
  });

  it('returns empty for too short array', () => {
    expect(computeWindowSums([1, 2], (x) => x, 3)).toEqual([]);
  });
});

describe('findTopNCheapestPeriods', () => {
  it('finds the n cheapest periods', () => {
    const arr = [5, 2, 1, 4, 3];
    const result = findTopNCheapestPeriods(arr, (x) => x, 2, 2);
    // All 2-length windows: [5+2=7, 2+1=3, 1+4=5, 4+3=7]
    // Sorted: [{1,3}, {2,5}]
        expect(result).toEqual([1, 2]);
  });

  it('returns empty for n=0 or too short', () => {
    expect(findTopNCheapestPeriods([1, 2], (x) => x, 3, 2)).toEqual([]);
    expect(findTopNCheapestPeriods([1, 2, 3], (x) => x, 2, 0)).toEqual([]);
  });
});

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
