import { useMemo } from 'react';
import { add, intervalToDuration, sub } from 'date-fns';
import EChart from './EChart';
import {
  BASE_OPTION,
  type ChartOption,
  type MarkLineItem,
  type MarkPointItem,
} from '../lib/echarts';
import { COLORS } from '../lib/colors';
import {
  formatShortDurationHoursMinsOnly,
  formatTimeLocal,
} from '../lib/dateUtils';
import type { PricePoint } from '../lib/pointUtils';
import { timerStartTimeMs } from '../lib/timerUtils';
import type { ConsumerConfig, TimerChoice } from '../lib/types';
import './StartTimeHintChart.css';

export type Props = {
  choice: TimerChoice;
  consumer: ConsumerConfig;
  periodPoints?: PricePoint[];
  showPeriod?: boolean;
};

/**
 * Timeline of a timer choice: when to set it, when the appliance starts and
 * ends, and the timer duration being dialled in.
 */
export default function StartTimeHintChart({
  choice,
  consumer,
  periodPoints,
  showPeriod = false,
}: Props) {
  const option = useMemo(() => {
    const setTime = choice.setTime.getTime();
    const startTime = timerStartTimeMs(
      choice.setTime,
      choice.timer,
      consumer.duration,
    ).getTime();
    const endTime = add(startTime, consumer.duration).getTime();
    const period =
      showPeriod && periodPoints?.length
        ? ([
            periodPoints[0].startMs,
            periodPoints[periodPoints.length - 1].endMs,
          ] as const)
        : undefined;
    return buildOption(choice.timer.mode, setTime, startTime, endTime, period);
  }, [choice, consumer.duration, periodPoints, showPeriod]);

  return <EChart className="start-time-hint-chart" option={option} />;
}

const SET = COLORS.PRIMARY_BLUE;
const START = COLORS.TIMER.START;
const END = COLORS.TIMER.END;
const FONT = { fontSize: 14, fontWeight: 'bold' } as const;

/** A boxed label at (x, y). */
function tag(
  x: number,
  y: number,
  text: string,
  color: string,
  position: 'top' | 'inside',
): MarkPointItem {
  return {
    name: text,
    coord: [x, y],
    symbolSize: 0,
    label: {
      show: true,
      position,
      distance: 0,
      formatter: text,
      color: '#fff',
      backgroundColor: 'black',
      borderColor: color,
      borderWidth: 2,
      borderRadius: 6,
      padding: [2, 4],
      ...FONT,
    },
  };
}

/** A vertical line at x from the axis up to y. */
function vline(x: number, y: number, color: string): MarkLineItem {
  return [{ coord: [x, 0], lineStyle: { color } }, { coord: [x, y] }];
}

/** A horizontal segment with end dots (empty when `range` is undefined). */
function segment(
  id: string,
  range: readonly [number, number] | undefined,
  y: number,
  color: string,
  toColor = color,
) {
  return {
    id,
    type: 'line' as const,
    silent: true,
    symbolSize: 7,
    lineStyle: { color, width: 3 },
    itemStyle: { color },
    data: range
      ? [[range[0], y], { value: [range[1], y], itemStyle: { color: toColor } }]
      : [],
  };
}

function buildOption(
  mode: TimerChoice['timer']['mode'],
  setTime: number,
  startTime: number,
  endTime: number,
  period?: readonly [number, number],
): ChartOption {
  const startsIn = mode === 'starts-in';
  const timerEnd = startsIn ? startTime : endTime;
  const timerColor = startsIn ? START : END;
  const timerLabel = formatShortDurationHoursMinsOnly(
    intervalToDuration({ start: setTime, end: timerEnd }),
  );
  const tickStyle = (value: number) =>
    value === setTime ? 'set' : value === startTime ? 'start' : 'end';

  return {
    ...BASE_OPTION,
    grid: { left: 28, right: 28, top: 6, bottom: 4 },
    xAxis: {
      type: 'value',
      min: sub(setTime, { hours: 1.2 }).getTime(),
      max: add(endTime, { hours: 1.2 }).getTime(),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.25)' } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        customValues: [startTime, endTime, setTime],
        rotate: 30,
        formatter: (value: number) =>
          `{${tickStyle(value)}|${formatTimeLocal(value)}}`,
        rich: {
          set: {
            ...FONT,
            color: COLORS.HOUR_LABEL,
            backgroundColor: SET,
            padding: 4,
          },
          start: { ...FONT, color: START },
          end: { ...FONT, color: END },
        },
      },
    },
    yAxis: { type: 'value', min: 0, max: 3.8, show: false },
    series: [
      {
        ...segment('set-to-start', [setTime, startTime], 0, SET),
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { width: 4, type: 'solid' },
          data: [
            vline(setTime, 3, SET),
            vline(startTime, startsIn ? 3 : 2, START),
            vline(endTime, startsIn ? 1 : 3, END),
          ],
        },
        markPoint: {
          silent: true,
          data: [
            tag(setTime, 0.25, 'Set', SET, 'top'),
            tag(startTime, 1.875, 'Start', START, 'inside'),
            tag(endTime, 0.25, 'End', END, 'top'),
          ],
        },
      },
      segment('run', [startTime, endTime], 0, START, END),
      {
        id: 'timer',
        type: 'line',
        silent: true,
        symbol: 'none',
        lineStyle: { color: timerColor, width: 4, type: [4, 2] },
        data: [
          [setTime, 3],
          [timerEnd, 3],
        ],
        markPoint: {
          silent: true,
          data: [
            tag((setTime + timerEnd) / 2, 3, timerLabel, timerColor, 'inside'),
          ],
        },
      },
      // Always present (empty when hidden) so merged updates stay consistent.
      segment('period', period, 2, START),
    ],
  } satisfies ChartOption;
}
