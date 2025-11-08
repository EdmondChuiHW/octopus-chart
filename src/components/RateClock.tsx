// constants used by the plugin are imported where needed inside the plugin file
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
  type RefCallback,
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
  nowMs: number;
};

export default function RateClock({
  dateKey,
  startHourOfDay,
  points: allPoints,
}: Props) {
  const [points, count] = useMemo(() => {
    const start = setHours(startOfDay(dateKey), startHourOfDay);
    const pointMap = new Map(allPoints.map((p) => [p.startMs, p]));
    const out: (PricePoint | undefined)[] = [];
    let count = 0;
    for (let i = 0; i < 24; i++) {
      const key = addMinutes(start, i * 30).getTime();
      const val = pointMap.get(key);
      out.push(val);
      if (val != null) {
        count++;
      }
    }

    return [out, count] as const;
  }, [allPoints, dateKey, startHourOfDay]);

  const data = useMemo<
    ChartData<'polarArea', (number | undefined)[], string | undefined>
  >(() => {
    const dataset: ChartDataset<'polarArea', (number | undefined)[]> = {
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
    return { labels: points.map((d) => d?.label), datasets: [dataset] };
  }, [points]);

  const plugins = useMemo(
    () => [hourLabelsPluginFactory(startHourOfDay)],
    [startHourOfDay],
  );

  const defaultActiveIndex = useMemo(() => findActiveIndex(points), [points]);
  const [activeIndex, setActiveIndex] = useState<number>(defaultActiveIndex);

  const optionsWithHover: ChartOptions<'polarArea'> = useMemo(() => {
    const options = structuredClone<ChartOptions<'polarArea'>>(OPTIONS);
    options.onHover = (_ev, elements) => {
      const index = elements.at(0)?.index;
      setActiveIndex(index ?? defaultActiveIndex);
    };

    const suggestedMax = Math.max(...allPoints.map((p) => p.y)) * 1;

    // Static type for OPTIONS has scales.r but not suggestedMax.
    // But ChartOptions<'polarArea'> 'scales' and 'r' are optional.
    // Thanks TypeScript lol
    options.scales ??= {};
    options.scales.r ??= {};
    options.scales.r.suggestedMax ??= suggestedMax;
    return options;
  }, [allPoints, defaultActiveIndex]);

  const chartRefRef = useRef<
    ChartJS<'polarArea', (number | undefined)[]> | undefined | null
  >(null);
  const chartRef: RefCallback<
    ChartJS<'polarArea', (number | undefined)[]> | undefined | null
  > = useCallback(
    (chart) => {
      chartRefRef.current = chart;
      setChartActiveIndex(chart, activeIndex);
    },
    [activeIndex],
  );
  useEffect(() => {
    setChartActiveIndex(chartRefRef.current, activeIndex);
  }, [activeIndex]);

  const [fullyVisibleRef, isFullyVisible] = useFullyVisible<HTMLDivElement>();

  const amPmLabel = startHourOfDay < 12 ? 'AM' : 'PM';

  if (count === 0) {
    return <b className="rate-clock">No data for {amPmLabel}</b>;
  }

  return (
    <div className="rate-clock">
      <div className="chart-container">
        <PolarArea
          ref={chartRef}
          data={data}
          options={optionsWithHover}
          plugins={plugins}
          style={{ touchAction: isFullyVisible ? 'pinch-zoom' : 'auto' }}
        />
        <div className="am-pm-label">
          <div className="label">{amPmLabel}</div>
        </div>
      </div>
      <HoverDisplay
        points={points}
        activeIndex={activeIndex}
        ref={fullyVisibleRef}
      />
    </div>
  );
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
    const index = activeIndex >= 0 ? activeIndex : findActiveIndex(points);
    return index < 0 ? undefined : points.at(index);
  }, [points, activeIndex]);

  return (
    <>
      <b>{point?.label ?? '–'}</b>
      <div ref={ref}>{point?.y ?? '–'}p/kWh</div>
    </>
  );
}

function findActiveIndex(points: (PricePoint | undefined)[]): number {
  return points.findIndex((p) => p?.status === 'active');
}

function setChartActiveIndex(
  chart: ChartJS<'polarArea', unknown> | undefined | null,
  index: number,
) {
  if (chart == null) return;

  if (index < 0) {
    chart.setActiveElements([]);
  } else {
    chart.setActiveElements([{ datasetIndex: 0, index }]);
  }
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
