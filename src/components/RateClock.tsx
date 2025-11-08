// constants used by the plugin are imported where needed inside the plugin file
import { useMemo, useState } from 'react';
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
      borderColor: (ctx) => {
        return points.at(ctx.dataIndex)?.borderColor ?? 'rgba(0,0,0,0.9)';
      },
      borderWidth: (ctx) => {
        return points.at(ctx.dataIndex)?.borderColor != null ? 4 : 1;
      },
      borderRadius: 4,
      borderAlign: 'inner',
    };
    return { labels: points.map((d) => d?.label), datasets: [dataset] };
  }, [points]);

  const plugins = useMemo(
    () => [hourLabelsPluginFactory(startHourOfDay)],
    [startHourOfDay],
  );

  const [hovered, setHovered] = useState<number>(-1);

  const optionsWithHover: ChartOptions<'polarArea'> = useMemo(() => {
    const options = structuredClone<ChartOptions<'polarArea'>>(OPTIONS);
    options.onHover = (_ev, elements) => {
      const index = elements.at(0)?.index;
      setHovered(index ?? -1);
    };

    const suggestedMax = Math.max(...allPoints.map((p) => p.y)) * 1;

    // Static type for OPTIONS has scales.r but not suggestedMax.
    // But ChartOptions<'polarArea'> 'scales' and 'r' are optional.
    // Thanks TypeScript lol
    options.scales ??= {};
    options.scales.r ??= {};
    options.scales.r.suggestedMax ??= suggestedMax;
    return options;
  }, [allPoints]);

  const amPmLabel = startHourOfDay < 12 ? 'AM' : 'PM';

  if (count === 0) {
    return <b className="rate-clock">No data for {amPmLabel}</b>;
  }

  return (
    <div className="rate-clock">
      <div className="chart-container">
        <PolarArea
          data={data}
          options={optionsWithHover}
          plugins={plugins}
          style={style}
        />
        <div className="am-pm-label">
          <div className="label">{amPmLabel}</div>
        </div>
      </div>
      <HoverDisplay points={points} activeIndex={hovered} />
    </div>
  );
}

function HoverDisplay({
  points,
  activeIndex,
}: {
  points: (PricePoint | undefined)[];
  activeIndex?: number;
}) {
  const index = useMemo(() => {
    if (activeIndex != null) return activeIndex;

    return points.findIndex((p) => p?.status === 'active');
  }, [points, activeIndex]);

  const point = useMemo(() => points.at(index), [points, index]);

  return (
    <>
      <b>{point?.label ?? '–'}</b>
      <div>{point?.y ?? '–'}p/kWh</div>
    </>
  );
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
    intersect: false,
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

const style: React.CSSProperties = {
  touchAction: 'pinch-zoom',
};
