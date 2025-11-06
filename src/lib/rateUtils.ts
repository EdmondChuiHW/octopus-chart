import type { PricePoint } from './types';
import { formatTimeLocal } from './dateUtils';
import { rateToColor } from './colors';
import { MS, NUM, COLORS, LOCALES, TIMEZONES } from './constants';

export type RateClockDataset = {
  labels: string[];
  dataValues: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number[];
};

// Pure helper: builds labels and data arrays for the RateClock component.
export function buildRateClockData(
  segments: PricePoint[],
  dateKey: string,
  startHour: number,
  nowMs: number,
): RateClockDataset {
  const segs = segments
    .slice()
    .sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
  const vals = segs.map((s) => s.value_inc_vat);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;

  // compute midnight for the dateKey in Europe/London
  const dayStart = new Date(
    new Date().toLocaleString(LOCALES.EN_GB, {
      timeZone: TIMEZONES.LONDON,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
  );
  if (dateKey !== dayStart.toLocaleDateString(LOCALES.EN_GB)) {
    const [dd, mm, yyyy] = dateKey.split('/');
    dayStart.setFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  const labels: string[] = [];
  const dataValues: number[] = [];
  const backgroundColor: string[] = [];
  const borderColor: string[] = [];
  const borderWidth: number[] = [];

  for (let i = 0; i < NUM.HALF_HOUR_STEPS_PER_12H; i++) {
    const start = new Date(
      dayStart.getTime() + (startHour * 60 + i * 30) * MS.PER_MINUTE,
    );
    const end = new Date(start.getTime() + MS.PER_HALF_HOUR);
    const match = segs.find((s) => s.valid_from.getTime() === start.getTime());
    const value = match ? match.value_inc_vat : NaN;

    labels.push(`${formatTimeLocal(start)}–${formatTimeLocal(end)}`);
    dataValues.push(isNaN(value) ? 0 : value);

    const isActive = nowMs >= start.getTime() && nowMs < end.getTime();

    let color: string;
    if (isNaN(value)) {
      color = COLORS.NO_DATA_BG;
    } else {
      const base = rateToColor(value, min, max);
      if (end.getTime() <= nowMs) {
        color = base.replace('rgb(', 'rgba(').replace(')', ',0.28)');
      } else if (isActive) {
        color = COLORS.PRIMARY_BLUE;
      } else {
        color = base;
      }
    }
    backgroundColor.push(color);

    if (isActive) {
      borderColor.push(COLORS.PRIMARY_BLUE);
      borderWidth.push(2);
    } else {
      borderColor.push(COLORS.BORDER_LIGHT);
      borderWidth.push(1);
    }
  }

  return { labels, dataValues, backgroundColor, borderColor, borderWidth };
}
