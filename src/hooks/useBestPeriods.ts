import type { Period, PricePoint } from '../lib/pointUtils';
import { findTopNCheapestPeriods } from '../lib/priceUtils';
import { useMemo } from 'react';

export default function useBestPeriods(
  points: PricePoint[],
  diffInHours: number,
  topN = Number.MAX_SAFE_INTEGER,
): Period[] {
  return useMemo(() => {
    const targetLength = Math.ceil(diffInHours * 2); // half-hourly points

    const indexes = findTopNCheapestPeriods(
      points,
      (p) => p.y,
      targetLength,
      topN,
    );

    const periods = indexes.map((pointsIndex) => ({
      index: pointsIndex,
      length: targetLength,
    }));

    return periods;
  }, [points, diffInHours, topN]);
}
