import type { PricePoint } from './types';
import { formatTimeLocal } from './dateUtils';
import { rateToColor } from './colors';
import { COLORS } from './constants';

export type BarChartData = {
  labels: string[];
  dataValues: number[];
  backgroundColors: string[];
  startMs: number[];
  endMs: number[];
};

/**
 * Pure helper to build the bar chart arrays used by `OctopusChart`.
 * - labels: human readable range per bar
 * - dataValues: numeric p/kWh (inc VAT)
 * - backgroundColors: color per bar based on active/expired/no-data
 * - startMs / endMs: arrays of epoch ms for each segment
 */
export function buildBarChartData(
  points: PricePoint[],
  nowMs: number,
): BarChartData {
  const labels: string[] = [];
  const dataValues: number[] = [];
  const backgroundColors: string[] = [];
  const startMs: number[] = [];
  const endMs: number[] = [];

  if (!points || points.length === 0) {
    return { labels, dataValues, backgroundColors, startMs, endMs };
  }

  // compute values for min/max colouring using incVatValue to be robust
  const values = points.map((p) => p.value_inc_vat);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  for (const p of points) {
    const start = p.valid_from.getTime();
    const end = p.valid_to.getTime();
    startMs.push(start);
    endMs.push(end);

    labels.push(
      `${formatTimeLocal(p.valid_from)}–${formatTimeLocal(p.valid_to)}`,
    );
    const v = p.value_inc_vat;
    dataValues.push(v);

    // active if now is within [start, end)
    if (nowMs >= start && nowMs < end) {
      backgroundColors.push(COLORS.PRIMARY_BLUE);
    } else if (nowMs >= end) {
      // past
      backgroundColors.push(COLORS.PRIMARY_BLUE_FADED);
    } else if (Number.isNaN(v)) {
      backgroundColors.push(COLORS.NO_DATA_BG);
    } else {
      backgroundColors.push(rateToColor(v, min, max));
    }
  }

  return { labels, dataValues, backgroundColors, startMs, endMs };
}
