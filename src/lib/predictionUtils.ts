import type { AgilePredictPrice } from './types';
import type { PricePoint, PointStatus } from './pointUtils';
import { formatTimeLocal } from './dateUtils';

const HALF_HOUR_MS = 30 * 60_000;
const ONE_DAY_MS = 24 * 60 * 60_000;

export function mergeChartData(
  points: PricePoint[],
  predictions: AgilePredictPrice[],
): PricePoint[] {
  if (!predictions.length) {
    return points;
  }

  const predByMs = new Map<number, AgilePredictPrice>();
  for (const p of predictions) {
    predByMs.set(new Date(p.date_time).getTime(), p);
  }

  const confirmedMsSet = new Set(points.map((p) => p.startMs));
  const maxConfirmedMs = points.reduce(
    (max, p) => Math.max(max, p.startMs),
    0,
  );
  const predictionCutoff = maxConfirmedMs + ONE_DAY_MS;

  const mergedPoints: PricePoint[] = [];

  for (const point of points) {
    mergedPoints.push({
      ...point,
      isConfirmed: true as const,
    });
  }

  for (const p of predictions) {
    const ms = new Date(p.date_time).getTime();
    if (!confirmedMsSet.has(ms) && ms <= predictionCutoff) {
      const date = new Date(p.date_time);
      const label = formatTimeLocal(date);
      const isOnTheHour = date.getMinutes() === 0;
      mergedPoints.push({
        x: ms,
        y: p.agile_pred,
        startMs: ms,
        endMs: ms + HALF_HOUR_MS,
        label,
        endLabel: formatTimeLocal(new Date(ms + HALF_HOUR_MS)),
        tickLabel: isOnTheHour ? label : undefined,
        status: 'upcoming' as PointStatus,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        isConfirmed: false,
        low: p.agile_low,
        high: p.agile_high,
      });
    }
  }

  return mergedPoints;
}
