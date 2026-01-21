import {
  Chart as ChartJS,
  TimeScale,
  type ChartData,
  type ChartOptions,
  type Point,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import type { ConsumerConfig, Timer, TimerChoice } from '../lib/types';
import { useMemo } from 'react';
import { add, intervalToDuration, sub } from 'date-fns';
import { timerStartTimeMs } from '../lib/timerUtils';
import type { PricePoint } from '../lib/pointUtils';

import annotationPlugin from 'chartjs-plugin-annotation';

import './StartTimeHintChart.css';
import { COLORS } from '../lib/colors';
import {
  formatShortDurationHoursMinsOnly,
  formatTimeLocal,
} from '../lib/dateUtils';

ChartJS.register(TimeScale, annotationPlugin);

export type Props = {
  relativeNow: Date | number;
  choice: TimerChoice;
  consumer: ConsumerConfig;
  periodPoints?: PricePoint[];
  showPeriod?: boolean;
};

export default function StartTimeHintChart({
  choice,
  consumer,
  periodPoints,
  showPeriod = false,
}: Props) {
  const [setTime, startTime, endTime] = useMemo(() => {
    const setTime = choice.setTime.getTime();
    const startTime = timerStartTimeMs(
      choice.setTime,
      choice.timer,
      consumer.duration,
    ).getTime();
    const endTime = add(startTime, consumer.duration).getTime();

    return [setTime, startTime, endTime];
  }, [choice.setTime, choice.timer, consumer.duration]);

  const data = useMemo<ChartData<'line'>>(() => {
    const datasets = [] as ChartData<'line'>['datasets'];
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
    const timerEndTime = (() => {
      switch (choice.timer.mode) {
        case 'starts-in':
          return startTime;
        case 'ends-in':
          return endTime;
        default:
          throw new Error(
            `Unknown timer mode: ${choice.timer.mode satisfies never}`,
          );
      }
    })();
    datasets[DATASET_INDEXES.TIMER_LINE] = {
      hidden: true,
      data: [
        {
          x: setTime,
          y: 3,
        },
        {
          x: timerEndTime,
          y: 3,
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

    const labels = [
      // relativeNow,
      startTime,
      endTime,
      setTime, // last so it can draw over others
    ];

    return {
      datasets,
      labels,
    };
  }, [
    choice.timer.mode,
    endTime,
    periodPoints,
    setTime,
    showPeriod,
    startTime,
  ]);

  const options = useMemo<ChartOptions<'line'>>(() => {
    const o = makeChartOptions();
    o.scales ??= {};
    o.scales.x ??= {};
    o.scales.x.suggestedMin = sub(setTime, { hours: 1.2 }).getTime();
    o.scales.x.suggestedMax = add(endTime, { hours: 1.2 }).getTime();
    return o;
  }, [endTime, setTime]);

  return (
    <div className="start-time-hint-chart">
      <Line options={options} data={data} />
    </div>
  );
}

const DATASET_INDEXES = {
  SET_TIME_LINE: 0,
  START_TIME_LINE: 1,
  TIMER_LINE: 2,
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

function getTimerMode(ctx: { chart: ChartJS }): Timer['mode'] {
  const startTime = getTimeMs(ctx, DATASET_INDEXES.TIMER_LINE, -1);
  if (startTime === getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE)) {
    return 'starts-in';
  }
  if (startTime === getTimeMs(ctx, DATASET_INDEXES.TIMER_LINE, -1)) {
    return 'ends-in';
  }

  throw new Error('Unable to determine timer mode');
}

const periodColor = COLORS.TIMER.START;
const endColor = COLORS.TIMER.END;

function makeChartOptions(): ChartOptions<'line'> {
  return {
    parsing: false,
    normalized: true,
    borderColor: COLORS.PRIMARY_BLUE,
    maintainAspectRatio: false,
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
        ticks: {
          source: 'labels',
          callback: formatTimeLocal,
          minRotation: 30,
          autoSkip: false,
          font: {
            size: 14,
            weight: 'bold',
          },
          color: (ctx) => {
            const thisTime = ctx.tick.value;
            if (thisTime === getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE)) {
              return periodColor;
            }
            if (
              thisTime === getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1)
            ) {
              return endColor;
            }

            return COLORS.HOUR_LABEL;
          },
          showLabelBackdrop: (ctx) => {
            const thisTime = ctx.tick.value;
            return thisTime === getTimeMs(ctx, DATASET_INDEXES.SET_TIME_LINE);
          },
          backdropPadding: 4,
          backdropColor: COLORS.PRIMARY_BLUE,
        },
        grid: { display: false },
      },
      y: { display: false, max: 3.8 },
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
            yMax: 3,
          },
          setTimeLabel: {
            type: 'label',
            z: 1,
            xValue: (ctx) => getTimeMs(ctx, DATASET_INDEXES.SET_TIME_LINE),
            yValue: 0.25,
            content: 'Set',
            display: true,
            position: {
              x: 'center',
              y: 'end',
            },
            color: 'white',
            borderRadius: 6,
            backgroundColor: 'black',
            borderColor: COLORS.PRIMARY_BLUE,
            borderWidth: 2,
            font: {
              size: 14,
              weight: 'bold',
            },
            padding: { x: 4, y: 2 },
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
            yMax: (ctx) => {
              const mode = getTimerMode(ctx);
              switch (mode) {
                case 'starts-in':
                  return 3;
                case 'ends-in':
                  return 2;
                default:
                  throw new Error(
                    `Unknown timer mode: ${mode satisfies never}`,
                  );
              }
            },
          },
          startTimeLabel: {
            type: 'label',
            content: 'Start',
            xValue: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE),
            yValue: 1.875,
            borderColor: periodColor,
            backgroundColor: 'black',
            borderWidth: 2,
            borderRadius: 6,
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold',
            },
            padding: { x: 4, y: 2 },
          },
          endTimeLine: {
            type: 'line',
            xMin: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
            xMax: (ctx) => getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
            drawTime: 'beforeDatasetsDraw',
            borderColor: endColor,
            borderWidth: 4,
            display: true,
            yMin: 0,
            yMax: (ctx) => {
              const mode = getTimerMode(ctx);
              switch (mode) {
                case 'starts-in':
                  return 1;
                case 'ends-in':
                  return 3;
                default:
                  throw new Error(
                    `Unknown timer mode: ${mode satisfies never}`,
                  );
              }
            },
          },
          endTimeLabel: {
            type: 'label',
            content: 'End',
            xValue: (ctx) =>
              getTimeMs(ctx, DATASET_INDEXES.START_TIME_LINE, -1),
            yValue: 0.25,
            borderColor: endColor,
            position: {
              x: 'center',
              y: 'end',
            },
            backgroundColor: 'black',
            borderWidth: 2,
            borderRadius: 6,
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold',
            },
            padding: { x: 4, y: 2 },
          },
          timerLine: {
            type: 'line',
            borderColor: (ctx) => {
              const mode = getTimerMode(ctx);
              switch (mode) {
                case 'starts-in':
                  return periodColor;
                case 'ends-in':
                  return endColor;
                default:
                  throw new Error(
                    `Unknown timer mode: ${mode satisfies never}`,
                  );
              }
            },
            borderWidth: 4,
            borderDash: [4, 2],
            yMin: 3,
            yMax: 3,
            xMin: (ctx) => getTimeMs(ctx, DATASET_INDEXES.TIMER_LINE),
            xMax: (ctx) => getTimeMs(ctx, DATASET_INDEXES.TIMER_LINE, -1),
            label: {
              display: true,
              content: (ctx) => {
                const timerDuration = intervalToDuration({
                  start: getTimeMs(ctx, DATASET_INDEXES.TIMER_LINE),
                  end: getTimeMs(ctx, DATASET_INDEXES.TIMER_LINE, -1),
                });
                return formatShortDurationHoursMinsOnly(timerDuration);
              },
              position: 'center',
              color: 'white',
              backgroundColor: 'black',
              borderColor: (ctx) => {
                const mode = getTimerMode(ctx);
                switch (mode) {
                  case 'starts-in':
                    return periodColor;
                  case 'ends-in':
                    return endColor;
                  default:
                    throw new Error(
                      `Unknown timer mode: ${mode satisfies never}`,
                    );
                }
              },
              borderWidth: 2,
              padding: { x: 4, y: 2 },
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
        },
      },
    },
  };
}
