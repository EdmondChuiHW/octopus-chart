/**
 * Computes all contiguous window sums of a given length in the points array.
 * @param points Array of data points
 * @param getValue Function to extract a numeric value from each point
 * @param targetLength Length of each window
 * @returns Array of objects: { startIndex, sum }
 */
export function computeWindowSums<E>(
  points: E[],
  getValue: (point: E) => number,
  targetLength: number,
): Array<{ startIndex: number; sum: number }> {
  if (!Number.isInteger(targetLength)) {
    throw new TypeError('targetLength must be an integer');
  }
  if (targetLength <= 0 || points.length <= 0) return [];
  if (points.length < targetLength) return [];

  const periods: Array<{ startIndex: number; sum: number }> = [];
  let sum = 0;
  for (let i = 0; i < targetLength; i++) {
    sum += getValue(points[i]);
  }
  periods.push({ startIndex: 0, sum });

  for (let i = targetLength; i < points.length; i++) {
    sum += getValue(points[i]) - getValue(points[i - targetLength]);
    periods.push({ startIndex: i - targetLength + 1, sum });
  }
  return periods;
}
// Example usage of heap-js MinHeap:
// import { Heap } from 'heap-js';
// // Min Heap by default
// const minHeap = new Heap();
// minHeap.init([5, 18, 1]);
// minHeap.push(2);
// console.log(minHeap.peek()); //> 1
// console.log(minHeap.pop()); //> 1
// console.log(minHeap.peek()); //> 2

/**
 * Finds the start indices of the n cheapest contiguous periods of a given length.
 * Allows overlapping periods.
 * @param points Array of data points
 * @param getValue Function to extract a numeric value from each point
 * @param targetLength Length of each period
 * @param n Number of cheapest periods to find
 * @returns Array of start indices, sorted by sum ascending (ties: lower index first)
 */
export function findTopNCheapestPeriods<E>(
  points: E[],
  getValue: (point: E) => number,
  targetLength: number,
  n: number,
): number[] {
  if (!Number.isInteger(targetLength) || !Number.isInteger(n)) {
    throw new TypeError('targetLength and n must be integers');
  }
  if (targetLength <= 0 || n <= 0 || points.length <= 0) return [];
  if (points.length < targetLength) return [];

  const periods = computeWindowSums(points, getValue, targetLength);
  periods.sort((a, b) => {
    if (a.sum !== b.sum) return a.sum - b.sum;
    return a.startIndex - b.startIndex;
  });
  return periods.slice(0, n).map((p) => p.startIndex);
}

export function findLowestPeriod<E>(
  points: E[],
  getValue: (point: E) => number,
  targetLength: number,
): number {
  if (!Number.isInteger(targetLength)) {
    throw new TypeError(`targetLength must be an integer. Got ${targetLength}`);
  }
  if (targetLength <= 0 || points.length <= 0) return -1;
  if (points.length < targetLength) return 0;

  let sum = 0;
  for (let i = 0; i < targetLength; i++) {
    sum += getValue(points[i]);
  }

  let bestStartIndex = 0;
  let bestSum = sum;

  for (let i = targetLength; i < points.length; i++) {
    sum += getValue(points[i]) - getValue(points[i - targetLength]);
    if (sum < bestSum) {
      bestSum = sum;
      bestStartIndex = i - targetLength + 1;
    }
  }

  return bestStartIndex;
}
