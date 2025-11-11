// constants used by the plugin are imported where needed inside the plugin file
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from 'react';
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
import { COLORS } from '../lib/constants';
import { pointerLinePluginFactory } from './chartPlugins/pointerLinePlugin';
import { nearestHoverPluginFactory } from './chartPlugins/nearestHoverPlugin';

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
      borderWidth: 1,
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

  const onLocalIndexHover = useCallback(
    (index: number) => {
      if (onHoverGlobalIndex == null) return;

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

  const plugins = useMemo(
    () => [
      hourLabelsPluginFactory(startHourOfDay),
      pointerLinePluginFactory(),
      nearestHoverPluginFactory(onLocalIndexHover),
    ],
    [startHourOfDay, onLocalIndexHover],
  );

  const optionsWithHover: ChartOptions<'polarArea'> = useMemo(() => {
    const options = structuredClone<ChartOptions<'polarArea'>>(OPTIONS);
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

  const [fullyVisibleRef, isFullyVisible] = useFullyVisible<HTMLDivElement>();

  const amPmLabel = startHourOfDay < 12 ? 'AM' : 'PM';

  if (count === 0) {
    return <b>No data for {amPmLabel}</b>;
  }

  return (
    <>
      <div className="chart-container">
        <ActiveIndexChart
          displayIndex={displayLocalIndex}
          data={data}
          options={optionsWithHover}
          plugins={plugins}
          style={{ touchAction: isFullyVisible ? 'pinch-zoom' : 'auto' }}
          onPointerEnter={() => setHovering?.(true)}
          onPointerOut={() => setHovering?.(false)}
        />
        <div className="am-pm-label">
          <div className="label">{amPmLabel}</div>
        </div>
      </div>
      <HoverDisplay
        points={points}
        activeIndex={displayLocalIndex[0]}
        ref={fullyVisibleRef}
      />
    </>
  );
}

function ActiveIndexChart({
  displayIndex: [activeIndex, chartUpdateMode],
  ...chartProps
}: {
  displayIndex: readonly [number, 'none' | 'default'];
} & ComponentProps<typeof PolarArea<(number | undefined)[]>>) {
  const ref = useRef<ChartJS<'polarArea', (number | undefined)[]> | null>(null);

  useEffect(() => {
    setChartActiveIndex(ref.current, activeIndex, chartUpdateMode);
  }, [activeIndex, chartUpdateMode]);

  return <PolarArea ref={ref} {...chartProps} />;
}

function HoverDisplay({
  points,
  activeIndex,
  ref,
}: {
  points: (PricePoint | undefined)[];
  activeIndex: number;
  ref?: Ref<HTMLDivElement>;
}) {
  const point = useMemo(() => {
    return activeIndex < 0 ? undefined : points.at(activeIndex);
  }, [points, activeIndex]);

  return (
    <div className="hover-display">
      <div>{point?.label ?? '–'}</div>
      <div ref={ref} className="rate">
        {point?.y ?? '–'}p/kWh
      </div>
    </div>
  );
}

function setChartActiveIndex(
  chart: ChartJS<'polarArea', unknown> | undefined | null,
  index: number,
  chartUpdateMode: 'none' | 'default' = 'default',
) {
  if (chart == null) return;

  if (index < 0) {
    chart.setActiveElements([]);
  } else {
    chart.setActiveElements([{ datasetIndex: 0, index }]);
  }
  chart.update(chartUpdateMode);
}

// can't go futher with `scales.r.suggestedMax` without a mess
type NoComponentOptions = Omit<ChartOptions<'polarArea'>, 'onHover'>;

const OPTIONS = {
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
        color: COLORS.CLOCK_CIRCLE,
        lineWidth: 4,
      },
    },
  },
} satisfies NoComponentOptions;

function useFullyVisible<E extends HTMLElement>(): readonly [Ref<E>, boolean] {
  const [isFullyVisible, setIsFullyVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ref: Ref<E> = useCallback((e: E | null) => {
    if (e == null) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }

    const callback: IntersectionObserverCallback = (entries) => {
      const entry = pickLastEntry(entries);
      if (!entry) return;

      setIsFullyVisible(entry.isIntersecting);
    };
    const options: IntersectionObserverInit = {
      threshold: 1.0,
    };
    observerRef.current = new IntersectionObserver(callback, options);
    observerRef.current.observe(e);
  }, []);

  return [ref, isFullyVisible] as const;
}

function pickLastEntry(entries: IntersectionObserverEntry[]) {
  let lastEntry: IntersectionObserverEntry | null = null;
  for (const entry of entries) {
    if (lastEntry == null || entry.time > lastEntry.time) {
      lastEntry = entry;
    }
  }
  return lastEntry;
}
