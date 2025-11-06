import type { PricePoint } from '../lib/types';
// constants used by the plugin are imported where needed inside the plugin file
import { useMemo } from 'react';
import { buildRateClockData } from '../lib/rateUtils';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';

import { PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  PolarAreaController,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { hourLabelsPluginFactory } from './chartPlugins/hourLabelsPlugin';

ChartJS.register(
  PolarAreaController,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
);

type Props = {
  dateKey: string;
  startHour: number;
  title: string;
  segments: PricePoint[];
  nowMs: number;
};

export default function RateClock({
  dateKey,
  startHour,
  title,
  segments,
  nowMs,
}: Props) {
  const { labels, dataValues, backgroundColor, borderColor, borderWidth } =
    useMemo(
      () => buildRateClockData(segments, dateKey, startHour, nowMs),
      [segments, dateKey, startHour, nowMs],
    );

  const data: ChartData<'polarArea', number[], string> = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor,
        borderColor,
        borderWidth,
      },
    ],
  };

  // plugin created via separate factory in ./chartPlugins/hourLabelsPlugin

  const options: ChartOptions<'polarArea'> = {
    maintainAspectRatio: false,
    layout: {
      padding: 8,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items: TooltipItem<'polarArea'>[]) => items[0]?.label ?? '',
          label: (ctx: TooltipItem<'polarArea'>) => {
            const v = ctx.parsed.r;
            return v == null ? 'No data' : `${v} p/kWh (inc VAT)`;
          },
        },
        bodyFont: { size: 16 },
        titleFont: { size: 14 },
      },
    },
    scales: {
      r: {
        ticks: { display: false, count: 2 },
        grid: {
          color: 'rgba(255,255,255,0.6)',
          lineWidth: 4,
        },
      },
    },
  };

  // container sizing moved to CSS (.chart-container)

  return (
    <div className="rate-clock" key={`${dateKey}-${startHour}`}>
      <div className="clock-title">{title}</div>
      <div className="chart-container">
        <PolarArea
          data={data}
          options={options}
          plugins={[hourLabelsPluginFactory(startHour)]}
        />
      </div>
    </div>
  );
}
