// constants used by the plugin are imported where needed inside the plugin file
import { useCallback, useMemo, useRef, type ComponentProps } from 'react';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';

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
import type { PricePoint } from '../lib/pointUtils';
import { addMinutes, setHours, startOfDay } from 'date-fns';
import { COLORS } from '../lib/colors';
import { pointerLinePluginFactory } from './chartPlugins/pointerLinePlugin';
import { nearestHoverPluginFactory } from './chartPlugins/nearestHoverPlugin';
import useActiveChartIndex from '../hooks/useActiveChartIndex';

ChartJS.register(
  PolarAreaController,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
);

type Props = {
  dateKey: Date | number | string;
  startHourOfDay: number;
  points: PricePoint[];
  displayIndex: readonly [number, 'none' | 'default'];
  onHover?: (index: number) => void;
  setHovering?: (isHovering: boolean) => void;
};

export default function RateClock({
  dateKey,
  startHourOfDay,
  points: allPoints,
  displayIndex: displayGlobalIndex,
  onHover: onHoverGlobalIndex,
  setHovering,
}: Props) {
  const allMax = useMemo(
    () => Math.max(...allPoints.map((p) => p.y)) * 1,
    [allPoints],
  );
  const [points, count] = useMemo(() => {
    const start = setHours(startOfDay(dateKey), startHourOfDay);
    const pointMap = new Map(allPoints.map((p) => [p.startMs, p]));
    const out: (PricePoint | undefined)[] = [];
    let count = 0;
    for (let i = 0; i < 24; i++) {
      const key = addMinutes(start, i * 30).getTime();
      const val = pointMap.get(key);
      out.push(val);
      if (val == null) continue;

      count++;
    }

    return [out, count] as const;
  }, [allPoints, dateKey, startHourOfDay]);

  const data = useMemo<
    ChartData<'polarArea', (number | undefined)[], string | undefined>
  >(() => {
    const visibleDataset: ChartDataset<'polarArea', (number | undefined)[]> = {
      label: 'p/kWh (inc VAT)',
      data: points.map((p) => p?.y ?? 0),
      backgroundColor: (ctx) => {
        return points.at(ctx.dataIndex)?.backgroundColor;
      },
      borderColor: 'rgba(0,0,0,0.9)',
      borderWidth: 0.7,
      hoverBorderColor: 'rgba(0,120,212,0.95)',
      hoverBorderWidth: 4,
      borderRadius: 4,
      borderAlign: 'inner',
    };

    const hitDataset: ChartDataset<'polarArea', number[]> = {
      label: 'hit-area',
      data: points.map((p) => (p ? allMax : 0)),
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
    };

    return {
      labels: points.map((d) => d?.label),
      datasets: [visibleDataset, hitDataset],
    };
  }, [allMax, points]);

  const displayLocalIndex = useMemo(() => {
    const [globalIndex, mode] = displayGlobalIndex;
    if (globalIndex < 0) {
      return [globalIndex, mode] as const;
    }

    const point = allPoints.at(globalIndex);
    if (point == null) {
      return [-1, mode] as const;
    }

    const localIndex = points.findIndex((p) => p?.startMs === point.startMs);
    return [localIndex, mode] as const;
  }, [allPoints, displayGlobalIndex, points]);

  const ref = useActiveChartIndex<ChartJS<'polarArea'>>(displayLocalIndex);

  const onLocalIndexHover = useCallback(
    (index: number) => {
      if (onHoverGlobalIndex == null) return;

      if (index < 0) {
        onHoverGlobalIndex(-1);
        return;
      }

      const point = points.at(index);
      if (point == null) {
        onHoverGlobalIndex(-1);
        return;
      }

      const globalIndex = allPoints.findIndex(
        (p) => p.startMs === point.startMs,
      );
      onHoverGlobalIndex(globalIndex);
    },
    [allPoints, onHoverGlobalIndex, points],
  );
  const alwaysOnLocalIndexHoverRef = useRef(onLocalIndexHover);
  alwaysOnLocalIndexHoverRef.current = onLocalIndexHover;

  const plugins = useMemo(
    () => [
      hourLabelsPluginFactory(startHourOfDay),
      pointerLinePluginFactory(),
      nearestHoverPluginFactory((i) => alwaysOnLocalIndexHoverRef.current(i)),
    ],
    [startHourOfDay],
  );

  const optionsWithHover: ChartOptions<'polarArea'> = useMemo(() => {
    const options: ChartOptions<'polarArea'> = makeOptions();
    // we handle hover with our own onPointerMove
    // cuz built-in hover resets active elements
    options.events = [];

    // Static type for OPTIONS has scales.r but not suggestedMax.
    // But ChartOptions<'polarArea'> 'scales' and 'r' are optional.
    // Thanks TypeScript lol
    options.scales ??= {};
    options.scales.r ??= {};
    options.scales.r.suggestedMax ??= allMax;
    return options;
  }, [allMax]);

  const amPmLabel = startHourOfDay < 12 ? 'AM' : 'PM';

  if (count === 0) {
    return <b>No data for {amPmLabel}</b>;
  }

  return (
    <>
      <div className="chart-container">
        <PolarArea
          data={data}
          ref={ref as ComponentProps<typeof PolarArea>['ref']}
          options={optionsWithHover}
          plugins={plugins}
          style={{ touchAction: 'pinch-zoom' }}
          onPointerEnter={() => setHovering?.(true)}
          onPointerOut={() => setHovering?.(false)}
        />
      </div>
      <div className="am-pm-label">
        <div className="label">{amPmLabel}</div>
      </div>
    </>
  );
}

// can't go futher with `scales.r.suggestedMax` without a mess
type NoComponentOptions = Omit<ChartOptions<'polarArea'>, 'onHover'>;

function makeOptions() {
  return {
    maintainAspectRatio: false,
    layout: {
      padding: 8,
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    hover: {
      // intersect: false,
    },
    scales: {
      r: {
        ticks: { display: false, count: 2 },
        grid: {
          color: (ctx) => {
            const canvas = ctx.chart.canvas;
            const parent = canvas.closest('.rate-clock');
            if (parent?.classList.contains('am')) {
              return 'rgba(2,14,18,0.56)';
            }
            return COLORS.CLOCK_CIRCLE;
          },
          lineWidth: 4,
        },
      },
    },
  } satisfies NoComponentOptions;
}
