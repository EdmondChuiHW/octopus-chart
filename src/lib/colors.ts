import { COLORS } from './constants';

export function rateToColor(value: number, min: number, max: number) {
  if (isNaN(value)) return COLORS.NO_DATA_BG || '#222';
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

export type PointStatus = 'active' | 'past' | 'upcoming' | 'no-data';

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
      return COLORS.PRIMARY_BLUE_FADED;
    case 'no-data':
      return COLORS.NO_DATA_BG;

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
  return status === 'active' ? COLORS.PRIMARY_BLUE : undefined;
}
