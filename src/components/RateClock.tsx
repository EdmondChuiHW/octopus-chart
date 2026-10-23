import { useMemo, useState, type PointerEvent } from 'react';
import EChart from './EChart';
import { BASE_OPTION, type ChartOption } from '../lib/echarts';
import { clockSlotAt } from '../lib/chartHelpers';
import { COLORS } from '../lib/colors';
import { MS } from '../lib/constants';
import type { PricePoint } from '../lib/pointUtils';
import type { ConsumerBestTime } from '../lib/types';

type Props = {
  dateKey: Date | number;
  startHourOfDay: 0 | 12;
  points: PricePoint[];
  /** Global index of the highlighted point, or -1. */
  displayIndex: number;
  onHover?: (index: number) => void;
  setHovering?: (isHovering: boolean) => void;
  consumerBestTimes?: ConsumerBestTime[];
};

const SLOTS = 24; // half-hours on a 12h face
const SLOT_NAMES = Array.from({ length: SLOTS }, (_, i) => String(i));

export default function RateClock({
  dateKey,
  startHourOfDay,
  points: allPoints,
  displayIndex,
  onHover,
  setHovering,
  consumerBestTimes,
}: Props) {
  const isAm = startHourOfDay < 12;
  // Pointer angle in clock hours (0-12), drives the clock hand.
  const [pointerHours, setPointerHours] = useState<number | null>(null);

  // Global point index for each of the 24 slots on this face (-1 = no data).
  const slotIndexes = useMemo(() => {
    const start = new Date(dateKey);
    start.setHours(startHourOfDay, 0, 0, 0);
    const indexByStart = new Map(allPoints.map((p, i) => [p.startMs, i]));
    return Array.from({ length: SLOTS }, (_, i) => {
      // setHours keeps DST transitions correct; slots are 30 min apart from there.
      return indexByStart.get(start.getTime() + i * MS.PER_HALF_HOUR) ?? -1;
    });
  }, [allPoints, dateKey, startHourOfDay]);

  const localActive =
    displayIndex >= 0 ? slotIndexes.indexOf(displayIndex) : -1;

  const option = useMemo(() => {
    const bestStarts = new Set(consumerBestTimes?.map((c) => c.bestStartMs));
    return buildOption({
      slots: slotIndexes.map((i) => (i >= 0 ? allPoints[i] : undefined)),
      maxVal: Math.max(...allPoints.map((p) => p.price)),
      minVal: Math.min(0, ...allPoints.map((p) => p.price)),
      bestStarts,
      activeSlot: localActive,
      startHourOfDay,
      isAm,
      pointerHours,
    });
  }, [
    allPoints,
    slotIndexes,
    consumerBestTimes,
    localActive,
    startHourOfDay,
    isAm,
    pointerHours,
  ]);

  const amPmLabel = isAm ? 'AM' : 'PM';
  if (slotIndexes.every((i) => i < 0)) {
    return <b>No data for {amPmLabel}</b>;
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const { slot, hours } = clockSlotAt(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height,
    );
    setPointerHours(hours);
    onHover?.(slotIndexes[slot]);
  }

  const displayPoint = localActive >= 0 ? allPoints[displayIndex] : undefined;

  return (
    <>
      <EChart
        className="chart-container"
        option={option}
        style={{ touchAction: 'pinch-zoom' }}
        onPointerEnter={() => setHovering?.(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setPointerHours(null);
          setHovering?.(false);
        }}
      />
      <div className="corner-label top-right">
        <div className="label">
          {displayPoint ? displayPoint.label.toUpperCase() : amPmLabel}
        </div>
      </div>
      {displayPoint && (
        <div className="corner-label bottom-right">
          <div className="label small">
            {displayPoint.price.toFixed(2)}p/kWh
          </div>
        </div>
      )}
    </>
  );
}

const RADIUS = '92%';
const BEST_RING_INNER = '78%'; // outer 15% of the face

function buildOption({
  slots,
  maxVal,
  minVal,
  bestStarts,
  activeSlot,
  startHourOfDay,
  isAm,
  pointerHours,
}: {
  slots: (PricePoint | undefined)[];
  maxVal: number;
  minVal: number;
  bestStarts: Set<number | undefined>;
  activeSlot: number;
  startHourOfDay: number;
  isAm: boolean;
  pointerHours: number | null;
}): ChartOption {
  const theme = isAm ? COLORS.CLOCK_LIGHT : COLORS.CLOCK_DARK;
  const face = {
    polarIndex: 1,
    coordinateSystem: 'polar' as const,
    silent: true,
    z: 10,
  };

  return {
    ...BASE_OPTION,
    // polar 0: price wedges; polar 1: clock face (0-12h) for ticks, numbers, hand.
    // polar 2: the best-times ring around the edge.
    polar: [
      { radius: [0, RADIUS] },
      { radius: [0, RADIUS] },
      { radius: [BEST_RING_INNER, RADIUS] },
    ],
    angleAxis: [
      {
        polarIndex: 0,
        type: 'category',
        data: SLOT_NAMES,
        startAngle: 90,
        show: false,
      },
      {
        polarIndex: 1,
        type: 'value',
        min: 0,
        max: 12,
        interval: 1,
        startAngle: 90,
        z: 10,
        axisLine: { lineStyle: { color: theme.ring, width: 4 } },
        axisTick: {
          inside: true,
          length: 14,
          lineStyle: { color: theme.hourTick, width: 3 },
        },
        minorTick: {
          show: true,
          splitNumber: 2,
          length: 9,
          lineStyle: { color: theme.halfTick, width: 3 },
        },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      {
        polarIndex: 2,
        type: 'category',
        data: SLOT_NAMES,
        startAngle: 90,
        show: false,
      },
    ],
    radiusAxis: [
      { polarIndex: 0, min: minVal, max: maxVal, show: false },
      { polarIndex: 1, min: 0, max: 1, show: false },
      { polarIndex: 2, min: 0, max: 1, show: false },
    ],
    series: [
      {
        id: 'price',
        type: 'bar',
        coordinateSystem: 'polar',
        polarIndex: 0,
        barCategoryGap: '0%',
        silent: true,
        data: slots.map((p, i) =>
          p
            ? {
                value: p.price,
                itemStyle: {
                  color: p.isConfirmed ? p.color : COLORS.PREDICTION_BAND,
                  borderColor:
                    i === activeSlot ? COLORS.PRIMARY_BLUE : COLORS.BAR_BORDER,
                  borderWidth: i === activeSlot ? 4 : 0.7,
                  borderRadius: 4,
                },
              }
            : '-',
        ),
      },
      {
        id: 'best',
        type: 'bar',
        coordinateSystem: 'polar',
        polarIndex: 2,
        barCategoryGap: '0%',
        silent: true,
        z: 3,
        data: slots.map((p) =>
          p && bestStarts.has(p.startMs)
            ? { value: 1, itemStyle: { color: COLORS.PRIMARY_BLUE_FADED } }
            : '-',
        ),
      },
      {
        ...face,
        id: 'hours',
        type: 'line',
        symbolSize: 0,
        lineStyle: { opacity: 0 },
        data: Array.from({ length: 12 }, (_, h) => [0.76, h]),
        label: {
          show: true,
          position: 'inside',
          formatter: ({ dataIndex }: { dataIndex: number }) =>
            String((startHourOfDay + dataIndex) % 12 || 12),
          color: theme.label,
          fontSize: 20,
          fontWeight: 'bold',
        },
      },
      {
        ...face,
        id: 'hand',
        type: 'line',
        symbol: 'none',
        z: 11,
        lineStyle: {
          color: COLORS.PRIMARY_BLUE,
          width: 4,
          cap: 'round',
          shadowBlur: 4,
          shadowColor: 'rgba(0,0,0,0.35)',
        },
        itemStyle: { color: COLORS.PRIMARY_BLUE },
        data:
          pointerHours == null
            ? []
            : [
                [0, pointerHours],
                {
                  value: [0.93, pointerHours],
                  symbol: 'circle',
                  symbolSize: 10,
                },
              ],
      },
    ],
  } satisfies ChartOption;
}
