const PRIMARY_BLUE = 'rgba(0,120,212,1)';
const PRIMARY_BLUE_FADED = 'rgba(0,120,212,0.5)';

/** Green (cheapest) -> red (most expensive). */
export function rateToColor(value: number, min: number, max: number) {
  const t = max > min ? (value - min) / (max - min) : 0.5;
  const r = Math.round(46 + (231 - 46) * t);
  const g = Math.round(204 + (76 - 204) * t);
  const b = Math.round(113 + (60 - 113) * t);
  return `rgb(${r},${g},${b})`;
}

export const COLORS = {
  PRIMARY_BLUE,
  PRIMARY_BLUE_FADED,
  PREDICTION: '#9B59B6',
  PREDICTION_BAND: 'rgba(195,155,211,0.4)',
  BAR_BORDER: 'rgba(0,0,0,0.9)',
  TICK: 'rgba(234,246,255,0.9)',
  GRID: 'rgba(255,255,255,0.08)',
  HOUR_LABEL: '#eaf6ff',

  // Clock faces: PM clocks are dark, AM clocks are light.
  CLOCK_DARK: {
    ring: 'rgba(255,255,255,0.6)',
    hourTick: 'rgba(255,255,255,0.6)',
    halfTick: 'rgba(234,246,255,0.4)',
    label: '#eaf6ff',
  },
  CLOCK_LIGHT: {
    ring: 'rgba(2,14,18,0.56)',
    hourTick: 'rgba(2,14,18,0.56)',
    halfTick: 'rgba(2,14,18,0.3)',
    label: '#000b0b',
  },

  TIMER: {
    START: rateToColor(0, 0, 1),
    END: rateToColor(1, 0, 1),
  },
} as const;
