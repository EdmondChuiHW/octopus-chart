import type { Duration } from 'date-fns';

export const CHART_DATA = {
  DEFAULT_PRODUCT: 'AGILE-24-10-01',
  DEFAULT_TARIFF: 'E-1R-AGILE-24-10-01-C',
  DEFAULT_LOOKBACK_DURATION: { hours: 1 } as Duration,
} as const;

export const MS = {
  PER_MINUTE: 60_000,
  PER_HALF_HOUR: 30 * 60_000,
  PER_HOUR: 60 * 60_000,
  PER_DAY: 24 * 60 * 60_000,
} as const;

// How often to update the UI "now" value (milliseconds)
export const TIMINGS = {
  NOW_UPDATE_INTERVAL: 30_000,
} as const;
