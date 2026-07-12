import type { PointStatus } from './pointUtils';

const NO_DATA_BG = 'rgba(30,30,30,0.6)';
const PRIMARY_BLUE = 'rgba(0,120,212,1)';
const PRIMARY_BLUE_FADED = 'rgba(0,120,212,0.5)';

export function rateToColor(value: number, min: number, max: number) {
  if (isNaN(value)) return NO_DATA_BG;
  const t = max > min ? (value - min) / (max - min) : 0.5;
  const r1 = 46,
    g1 = 204,
    b1 = 113;
  const r2 = 231,
    g2 = 76,
    b2 = 60;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function getPointStatus(
  nowMs: number,
  start: number,
  end: number,
  val: number,
): PointStatus {
  if (nowMs >= start && nowMs < end) {
    return 'active';
  } else if (nowMs >= end) {
    return 'past';
  } else if (Number.isNaN(val)) {
    return 'no-data';
  }

  return 'upcoming';
}

export function getBackgroundColorForPoint(
  status: PointStatus,
  val: number,
  min: number,
  max: number,
): string {
  switch (status) {
    case 'past':
      return PRIMARY_BLUE_FADED;
    case 'no-data':
      return NO_DATA_BG;

    case 'active': // fall-thru
    case 'upcoming':
      return rateToColor(val, min, max);
    default:
      throw new TypeError(`Invalid status value: ${status satisfies never}`);
  }
}

export function getBorderColorForPoint(
  status: PointStatus,
  _val: number,
  _min: number,
  _max: number,
): string | undefined {
  return status === 'active' ? PRIMARY_BLUE : undefined;
}

export const COLORS = {
  NO_DATA_BG,
  PRIMARY_BLUE,
  PRIMARY_BLUE_FADED,
  PREDICTION: '#9B59B6',
  BORDER_LIGHT: 'rgba(0,0,0,0.12)',
  HOUR_TICK: 'rgba(255,255,255,0.6)',
  CLOCK_CIRCLE: 'rgba(255,255,255,0.6)',
  HALF_TICK: 'rgba(234,246,255,0.55)',
  HOUR_LABEL: '#eaf6ff',

  TIMER: {
    START: rateToColor(0, 0, 1),
    END: rateToColor(1, 0, 1),
  },
} as const;
