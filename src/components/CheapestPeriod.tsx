import { useMemo } from 'react';
import type { Period, PricePoint } from '../lib/pointUtils';

export type Props = {
  points: PricePoint[];
  period: Period;
};

export default function CheapestPeriod({ points, period }: Props) {
  const [periodPoints, periodAvg] = useMemo(() => {
    if (period.index < 0) {
      return [null, null];
    }

    const periodPoints = points.slice(
      period.index,
      period.index + period.length,
    );
    const avg =
      periodPoints.reduce((sum, p) => sum + p.y, 0) / periodPoints.length;
    return [periodPoints, avg];
  }, [period, points]);

  return (
    <div>
      <div>
        Avg {periodAvg?.toFixed(2)}p/kWh <b>{periodPoints?.[0].label}</b>–
        {periodPoints?.at(-1)?.endLabel}
      </div>
    </div>
  );
}
