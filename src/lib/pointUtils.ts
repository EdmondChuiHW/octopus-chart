import { COLORS, rateToColor } from './colors';
import { CHART_DATA, MS } from './constants';
import { formatTimeLocal } from './dateUtils';
import { milliseconds } from 'date-fns';
import type { ForecastSlot, PriceSlot } from './types';

export type PointStatus = 'active' | 'past' | 'upcoming';

/** Everything the charts need for one half-hour, precomputed once. */
export type PricePoint = {
  startMs: number;
  endMs: number;
  /** p/kWh inc VAT; the median for predictions. */
  price: number;
  /** Prediction range. Equal to `price` for confirmed points. */
  low: number;
  high: number;
  isConfirmed: boolean;
  status: PointStatus;
  /** Fill colour ('transparent' for predictions, which are drawn as a band). */
  color: string;
  /** e.g. "3pm", "3:30pm" */
  label: string;
  isOnTheHour: boolean;
};

export type Period = {
  index: number;
  length: number;
};

/**
 * Builds chart points from published prices (from one lookback window before
 * `nowMs`), optionally followed by up to a day of forecast prices.
 */
export function buildPoints(
  slots: readonly PriceSlot[],
  nowMs: number,
  forecast?: readonly ForecastSlot[],
): PricePoint[] {
  const fromMs = nowMs - milliseconds(CHART_DATA.DEFAULT_LOOKBACK_DURATION);
  const recent = slots.filter((s) => s.startMs > fromMs);
  if (recent.length === 0) return [];

  let min = Infinity;
  let max = -Infinity;
  for (const s of recent) {
    min = Math.min(min, s.price);
    max = Math.max(max, s.price);
  }

  const points: PricePoint[] = recent.map((s) => {
    const status: PointStatus =
      nowMs >= s.endMs ? 'past' : nowMs >= s.startMs ? 'active' : 'upcoming';
    return {
      ...timeFields(s.startMs, s.endMs),
      price: s.price,
      low: s.price,
      high: s.price,
      isConfirmed: true,
      status,
      color:
        status === 'past'
          ? COLORS.PRIMARY_BLUE_FADED
          : rateToColor(s.price, min, max),
    };
  });

  if (forecast?.length) {
    const lastStartMs = recent[recent.length - 1].startMs;
    const cutoffMs = lastStartMs + MS.PER_DAY;
    for (const f of forecast) {
      if (f.startMs <= lastStartMs || f.startMs > cutoffMs) continue;
      points.push({
        ...timeFields(f.startMs, f.startMs + MS.PER_HALF_HOUR),
        price: f.price,
        low: f.low,
        high: f.high,
        isConfirmed: false,
        status: 'upcoming',
        color: 'transparent',
      });
    }
  }

  return points;
}

function timeFields(startMs: number, endMs: number) {
  const start = new Date(startMs);
  return {
    startMs,
    endMs,
    label: formatTimeLocal(start),
    isOnTheHour: start.getMinutes() === 0,
  };
}

/** Text for a point's price, e.g. "12.34p/kWh" or "10.00–14.00p/kWh". */
export function formatPrice(p: PricePoint, unit = 'p/kWh'): string {
  return p.isConfirmed
    ? `${p.price.toFixed(2)}${unit}`
    : `${p.low.toFixed(2)}–${p.high.toFixed(2)}${unit}`;
}
