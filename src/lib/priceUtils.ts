export function findLowestPeriod<E>(
  points: E[],
  getValue: (point: E) => number,
  targetLength: number,
): number {
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
