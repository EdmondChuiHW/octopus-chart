import { useMemo } from 'react';
import type { Period, PricePoint } from '../lib/pointUtils';
import { ColorText } from './ColorText';

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

  const startPoint = periodPoints?.[0];
  const endPoint = periodPoints?.at(-1);
  if (!startPoint || !endPoint || periodAvg == null) {
    return <div>Cannot find cheapest period.</div>;
  }

  return (
    <span
      style={{ flexGrow: 1, display: 'inline-flex', alignItems: 'baseline' }}
    >
      <ColorText type="start">{startPoint.label}</ColorText>–
      <ColorText type="end">{endPoint.endLabel}</ColorText>
      <span style={{ flexGrow: 1 }}></span>
      <small>{periodAvg.toFixed(2)}p/kWh</small>
    </span>
  );
}
