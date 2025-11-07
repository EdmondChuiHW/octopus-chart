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

export const NUM = {
  HOURS_PER_DAY: 24,
  HOURS_ON_CLOCK: 12,
  HALF_HOUR_STEPS_PER_12H: 24, // used by existing logic (24 half-hour steps -> 12 hours)
} as const;

export const COLORS = {
  PRIMARY_BLUE: 'rgba(0,120,212,0.95)',
  PRIMARY_BLUE_FADED: 'rgba(0,120,212,0.28)',
  NO_DATA_BG: 'rgba(30,30,30,0.6)',
  BORDER_LIGHT: 'rgba(0,0,0,0.12)',
  HOUR_TICK: 'rgba(255,255,255,0.6)',
  CLOCK_CIRCLE: 'rgba(255,255,255,0.6)',
  HALF_TICK: '#eaf6ff',
  HOUR_LABEL: '#eaf6ff',
} as const;

export const CLOCK_LAYOUT = {
  SCALE_FALLBACK_PADDING: 12,
  R_TICK_OUTER_DELTA: 2,
  R_TICK_HOUR_MIN: 12,
  R_TICK_HOUR_RATIO: 0.12,
  R_TICK_HALF_MIN: 8,
  R_TICK_HALF_RATIO: 0.08,
  R_LABEL_MIN: 24,
  R_LABEL_RATIO: 0.22,
  HOUR_FONT_RATIO: 0.16,
} as const;
