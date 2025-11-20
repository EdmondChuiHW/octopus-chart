import {
  Chart as ChartJS,
  TimeScale,
  type ChartData,
  type ChartOptions,
  type Point,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import type { ConsumerConfig, TimerChoice } from '../lib/types';
import { useMemo } from 'react';
import { add, getTime } from 'date-fns';
import { timerStartTimeMs } from '../lib/timerUtils';
import type { PricePoint } from '../lib/pointUtils';

import { rateToColor } from '../lib/colors';
import annotationPlugin from 'chartjs-plugin-annotation';

import './StartTimeHintChart.css';
import { COLORS } from '../lib/constants';
import { formatTimeLocal } from '../lib/dateUtils';

ChartJS.register(TimeScale, annotationPlugin);

export type Props = {
  relativeNow: Date | number;
  choice: TimerChoice;
  consumer: ConsumerConfig;
  periodPoints?: PricePoint[];
  showPeriod?: boolean;
};

export default function StartTimeHintChart({
  relativeNow,
  choice,
  consumer,
  periodPoints,
  showPeriod = false,
}: Props) {
  const data = useMemo<ChartData<'line'>>(() => {
    const setTime = choice.setTime.getTime();
    const startTime = timerStartTimeMs(
      choice.setTime,
      choice.timer,
      consumer.duration,
    ).getTime();
    const endTime = add(startTime, consumer.duration).getTime();

    const datasets = Array(3) as ChartData<'line'>['datasets'];
    datasets[DATASET_INDEXES.NOW_LINE] = {
      order: DATASET_INDEXES.NOW_LINE * -1,
      borderColor: COLORS.PRIMARY_BLUE,
      borderDash: [2, 2],
      data: [
        {
          x: getTime(relativeNow),
          y: 0,
        },
        {
          x: setTime,
          y: 0,
        },
      ],
    };
    datasets[DATASET_INDEXES.SET_TIME_LINE] = {
      order: DATASET_INDEXES.SET_TIME_LINE * -1,
      borderColor: COLORS.PRIMARY_BLUE,
      data: [
        {
          x: setTime,
          y: 0,
        },
        {
          x: startTime,
          y: 0,
        },
      ],
    };
    datasets[DATASET_INDEXES.START_TIME_LINE] = {
      order: DATASET_INDEXES.START_TIME_LINE * -1,
      borderColor: (ctx) => (ctx.dataIndex === 1 ? endColor : periodColor),
      data: [
        {
          x: startTime,
          y: 0,
        },
        {
          x: endTime,
          y: 0,
        },
      ],
    };

    if (showPeriod && periodPoints?.length) {
      // lol TS is so dumb
      const periodEndMs = periodPoints.at(-1)?.endMs;
      if (periodEndMs == null) {
        throw new Error(
          'Invalid periodPoints: missing periodEndMs on last point',
        );
      }
      datasets[DATASET_INDEXES.PERIOD_LINE] = {
        borderColor: periodColor,
        data: [
          {
            x: periodPoints[0].startMs,
            y: 2,
          },
          {
            x: periodEndMs,
            y: 2,
          },
        ],
      };
    }

    return { datasets };
  }, [
    choice.setTime,
    choice.timer,
    consumer.duration,
    periodPoints,
    relativeNow,
    showPeriod,
  ]);

  return (
    <div className="start-time-hint-chart">
      <Line options={chartOptions} data={data} />
    </div>
  );
}

const DATASET_INDEXES = {
  NOW_LINE: 0,
  SET_TIME_LINE: 1,
  START_TIME_LINE: 2,
  PERIOD_LINE: 3,
} as const;

function getDataset(ctx: { chart: ChartJS }, datasetIndex: number): Point[] {
  return ctx.chart.data.datasets[datasetIndex].data as Point[];
}

function getTimeMs(
  ctx: { chart: ChartJS },
  datasetIndex: number,
  index?: number,
): number {
  return getDataset(ctx, datasetIndex).at(index ?? 0)?.x ?? -1;
}

function getTimeLabel(
  ctx: { chart: ChartJS },
  datasetIndex: number,
  index?: number,
): string {
  const setTime = getTimeMs(ctx, datasetIndex, index);
  return setTime < 0 ? '' : formatTimeLocal(setTime);
}

const periodColor = rateToColor(0, 0, 1);
const endColor = rateToColor(1, 0, 1);

const chartOptions: ChartOptions<'line'> = {
  parsing: false,
  borderColor: COLORS.PRIMARY_BLUE,
  maintainAspectRatio: false,
  layout: {
    padding: { left: 12, right: 12, top: 0, bottom: 0 },
  },
  events: [],
  elements: {
    point: {
      backgroundColor: (ctx, options) =>
        ctx.datasetIndex === DATASET_INDEXES.START_TIME_LINE &&
        ctx.dataIndex === 1
          ? endColor
          : 'borderColor' in options
            ? (options.borderColor as string)
            : 'transparent',
    },
  },
  scales: {
    x: {
      type: 'time',
      ticks: { display: false },
      offset: true,
      display: false,
    },
    y: { display: false, max: 1.5 },
  },
  plugins: {
    legend: { display: false },
    annotation: {
      annotations: {
        setTimeLine: {
          type: 'line',
          xMin: (ctx) => getTimeMs(ctx, DATASET_INDEXES.SET_TIME_LINE),
          xMax: (ctx) => getTimeMs(ctx, DATASET_INDEXES.SET_TIME_LINE),
          drawTime: 'beforeDatasetsDraw',
          borderColor: COLORS.PRIMARY_BLUE,
          borderWidth: 4,
          display: true,
          yMin: 0,
          yMax: 1,
          label: {
            z: 1,
            content: (ctx) => getTimeLabel(ctx, DATASET_INDEXES.SET_TIME_LINE),
            display: true,
            position: 'end',
            backgroundColor: COLORS.PRIMARY_BLUE,
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
        setTimeLabel: {
          type: 'label',
          xValue: (ctx) => getTimeMs(ctx, DATASET_INDEXES.SET_TIME_LINE),
          content: 'Set',
          yValue: -0.6,
          display: true,
          position: 'center',
          color: COLORS.PRIMARY_BLUE,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        startTimeLine: {
          type: 'line',
          xMin: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE),
          xMax: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE),
          drawTime: 'beforeDatasetsDraw',
          borderColor: periodColor,
          borderWidth: 4,
          display: true,
          yMin: 0,
          yMax: 1,
          label: {
            display: true,
            content: (ctx) =>
              getTimeLabel(ctx, DATASET_INDEXES.START_TIME_LINE),
            position: 'end',
            borderColor: periodColor,
            backgroundColor: 'black',
            borderWidth: 2,
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
        startTimeLabel: {
          type: 'label',
          xValue: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE),
          content: 'Start',
          yValue: -0.6,
          display: true,
          position: 'center',
          color: periodColor,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        endTimeLine: {
          type: 'line',
          xMin: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
          xMax: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
          borderColor: endColor,
          borderWidth: 4,
          display: true,
          yMin: 0,
          yMax: 1,
          label: {
            display: true,
            content: (ctx) =>
              getTimeLabel(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
            position: 'end',
            borderColor: endColor,
            borderWidth: 2,
            color: '#ffffff',
            backgroundColor: 'black',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
        endTimeLabel: {
          type: 'label',
          xValue: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
          content: 'End',
          yValue: -0.6,
          display: true,
          position: 'center',
          color: endColor,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
    },
  },
};
