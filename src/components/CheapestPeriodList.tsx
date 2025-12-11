import { formatDuration, isAfter } from 'date-fns';
import type { Period, PricePoint } from '../lib/pointUtils';
import { findLowestPeriod } from '../lib/priceUtils';
import CheapestPeriod from './CheapestPeriod';
import { useMemo } from 'react';

export type Props = {
  points: PricePoint[];
  relativeNow: Date | number;
};

const DIFFS_IN_HOURS = new Set([1, 1.5, 2, 2.5, 3]);

export default function CheapestPeriodList({
  points: allPoints,
  relativeNow,
}: Props) {
  const periods = useMemo(() => {
    const points = allPoints.filter((p) => isAfter(p.startMs, relativeNow));
    return [...DIFFS_IN_HOURS].map((diffInHours) => {
      const targetLength = diffInHours * 2; // half-hourly points
      const index = findLowestPeriod(points, (p) => p.y, targetLength);
      const period: Period = { index, length: targetLength };
      const startPoint = period.index >= 0 ? points[period.index] : null;
      const formattedDuration = formatDuration(
        {
          hours: Math.floor(diffInHours),
          minutes: (diffInHours % 1) * 60,
        },
        {
          format: ['hours', 'minutes'],
        },
      );

      if (!startPoint) {
        return <>Cannot find the cheapest period for {formattedDuration}</>;
      }

      return (
        <div style={{ marginBottom: '2em' }} key={diffInHours}>
          <h2>{formattedDuration}</h2>
          <CheapestPeriod key={diffInHours} points={points} period={period} />
        </div>
      );
    });
  }, [allPoints, relativeNow]);
  return <>{periods}</>;
}
