import { useMemo } from 'react';
import type { Period, PricePoint } from '../lib/pointUtils';
import { ColorText } from './ColorText';
import { formatTimeLocal } from '../lib/dateUtils';

import './CheapestPeriod.css';

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
    <Inner
      startMs={startPoint.startMs}
      endMs={endPoint.endMs}
      periodAvg={periodAvg}
    />
  );
}

function Inner({
  startMs,
  endMs,
  periodAvg,
}: {
  startMs: number;
  endMs: number;
  periodAvg: number;
}) {
  const startLabel = useMemo(() => formatTimeLocal(startMs), [startMs]);
  const endLabel = useMemo(() => formatTimeLocal(endMs), [endMs]);
  const periodLabel = useMemo(() => periodAvg.toFixed(2), [periodAvg]);

  return (
    <span
      style={{
        flexGrow: 1,
        display: 'inline-flex',
        alignItems: 'baseline',
        textAlign: 'start',
      }}
    >
      <span style={{ flex: 1, display: 'inline-flex' }}>
        <ColorText type="start">{startLabel}</ColorText>
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            flexGrow: 1,
          }}
        >
          <span className="period-gap top radio-form-aware" aria-label="–" />
          <span style={{ flex: 1 }} />
        </span>
      </span>
      <span style={{ flex: 1 }}>
        <ColorText type="end">{endLabel}</ColorText>
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: 'small' }}>
        {periodLabel}p/kWh
      </span>
    </span>
  );
}
