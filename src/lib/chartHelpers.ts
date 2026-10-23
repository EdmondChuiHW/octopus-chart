import type { ECharts } from './echarts';
import { COLORS } from './colors';
import type { PricePoint } from './pointUtils';

type AxisLabel = Record<string, unknown>;

/**
 * Category axes for the price bars, stacked on the same side of the grid:
 * labels on the hour with a short tick on every half-hour boundary, plus a
 * second (label-less) axis drawing longer ticks on the hour.
 * (Replaces the old hand-drawn axisTickPlugin.)
 */
export function priceCategoryAxes(
  points: readonly PricePoint[],
  label: AxisLabel,
  extra: Record<string, unknown>,
) {
  const base = {
    type: 'category' as const,
    data: points.map((p) => p.label),
    axisLine: { show: false },
    splitLine: { show: false },
    ...extra,
  };
  const onTheHour = (i: number) => points[i]?.isOnTheHour ?? false;
  return [
    {
      ...base,
      axisLabel: { interval: onTheHour, hideOverlap: true, ...label },
      axisTick: {
        interval: 0,
        length: 6,
        lineStyle: { color: COLORS.TICK, width: 1 },
      },
    },
    {
      ...base,
      axisLabel: { show: false },
      axisTick: {
        interval: onTheHour,
        length: 10,
        lineStyle: { color: COLORS.TICK, width: 2 },
      },
    },
  ];
}

/** Index of the bar under pixel `x` (relative to the chart), or -1. */
export function barIndexAtPixel(
  chart: ECharts,
  x: number,
  count: number,
): number {
  const value = chart.convertFromPixel({ xAxisIndex: 0 }, x) as unknown;
  const index = typeof value === 'number' ? Math.round(value) : -1;
  return index >= 0 && index < count ? index : -1;
}

/**
 * Which of the 24 half-hour slots of a 12h clock face is under (x, y),
 * by angle only, plus that angle in clock hours (0-12) for the pointer hand.
 */
export function clockSlotAt(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const dx = x - width / 2;
  const dy = y - height / 2;
  const turn = (((Math.atan2(dx, -dy) / (2 * Math.PI)) % 1) + 1) % 1; // 0 = 12 o'clock, clockwise
  return { slot: Math.min(23, Math.floor(turn * 24)), hours: turn * 12 };
}

/**
 * Forecast series: a shaded low–high band (stacked lines) and the median line.
 * Confirmed points are gaps ('-').
 */
export function predictionSeries(points: readonly PricePoint[]) {
  const forecast = (value: (p: PricePoint) => number) =>
    points.map((p) => (p.isConfirmed ? '-' : value(p)));
  const common = {
    type: 'line' as const,
    silent: true,
    symbol: 'none',
    stackStrategy: 'all' as const, // band may straddle zero
  };
  return [
    {
      ...common,
      id: 'low',
      stack: 'band',
      lineStyle: { opacity: 0 },
      data: forecast((p) => p.low),
    },
    {
      ...common,
      id: 'band',
      stack: 'band',
      lineStyle: { opacity: 0 },
      areaStyle: { color: COLORS.PREDICTION_BAND, opacity: 1 },
      data: forecast((p) => p.high - p.low),
    },
    {
      ...common,
      id: 'prediction',
      lineStyle: { color: COLORS.PREDICTION, width: 3 },
      data: forecast((p) => p.price),
    },
  ];
}
