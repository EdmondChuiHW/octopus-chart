import type { ApiPricePoint } from './types';
import { formatTimeLocal } from './dateUtils';
import {
  getBackgroundColorForPoint,
  getBorderColorForPoint,
  getPointStatus,
} from './colors';
import { isAfter, sub } from 'date-fns';
import { CHART_DATA } from './constants';

export type PointStatus = 'active' | 'past' | 'upcoming' | 'no-data';

export type PricePoint = {
  // x is the start timestamp (ms) used by the timeseries scale
  x: number;
  // y is the numeric value (p/kWh inc VAT)
  y: number;
  startMs: number;
  endMs: number;
  label: string;
  tickLabel: string | undefined;
  status: PointStatus;
  backgroundColor: string;
  borderColor: string | undefined;
};

/**
 * Pure helper to build the bar chart arrays used by `OctopusChart`.
 * - labels: human readable range per bar
 * - dataPoints: array of per-bar objects containing x/y, label and styling
 */
export function buildPointsData(
  points: ApiPricePoint[],
  nowMs: number,
): PricePoint[] {
  const dataPoints: PricePoint[] = [];

  if (points.length === 0) {
    return dataPoints;
  }

  points = points.filter((p) =>
    isAfter(p.valid_from, sub(nowMs, CHART_DATA.DEFAULT_LOOKBACK_DURATION)),
  );
  const values = points.map((p) => p.value_inc_vat);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  for (const p of points) {
    const start = p.valid_from.getTime();
    const end = p.valid_to.getTime();

    const isOnTheHour = p.valid_from.getMinutes() === 0;

    const startStr = formatTimeLocal(p.valid_from);
    // const endStr = formatTimeLocal(p.valid_to);
    const label = startStr;

    const v = p.value_inc_vat;
    const status = getPointStatus(nowMs, start, end, v);
    const backgroundColor = getBackgroundColorForPoint(status, v, min, max);
    const borderColor = getBorderColorForPoint(status, v, min, max);

    const datum: PricePoint = {
      x: start,
      y: v,
      startMs: start,
      endMs: end,
      label,
      tickLabel: status === 'active' || isOnTheHour ? startStr : undefined,
      backgroundColor,
      borderColor,
      status,
    };
    dataPoints.push(datum);
  }

  return dataPoints;
}
