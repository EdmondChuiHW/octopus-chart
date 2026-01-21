import { isAfter } from 'date-fns';
import type { Period, PricePoint } from '../lib/pointUtils';
import { findTopNCheapestPeriods } from '../lib/priceUtils';
import { useMemo } from 'react';

export default function useBestPeriods(
  allPoints: PricePoint[],
  relativeNow: Date | number,
  diffInHours: number,
  topN = Number.MAX_SAFE_INTEGER,
): Period[] {
  return useMemo(() => {
    const points = allPoints.filter((p) => isAfter(p.startMs, relativeNow));
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
  }, [allPoints, diffInHours, relativeNow, topN]);
}
