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
import type { Point } from '../lib/pointUtils';
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
  title: string;
  points: Point[];
  nowMs: number;
};

export default function RateClock({
  dateKey,
  startHourOfDay,
  title,
  points: allPoints,
}: Props) {
  const points: (Point | undefined)[] = useMemo(() => {
    const start = setHours(startOfDay(dateKey), startHourOfDay);
    const pointMap = new Map(allPoints.map((p) => [p.startMs, p]));
    const out: (Point | undefined)[] = [];
    for (let i = 0; i < 24; i++) {
      const key = addMinutes(start, i * 30).getTime();
      // pushing undefined is also intended
      out.push(pointMap.get(key));
    }

    return out;
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

  const optionsWithHover: ChartOptions<'polarArea'> = useMemo(
    () => ({
      ...options,
      onHover(_ev, elements) {
        const index = elements.at(0)?.index;
        setHovered(index ?? -1);
      },
    }),
    [],
  );

  return (
    <div className="rate-clock">
      <div className="clock-title">{title}</div>
      <div className="chart-container">
        <PolarArea data={data} options={optionsWithHover} plugins={plugins} />
      </div>
      <HoverDisplay points={points} activeIndex={hovered} />
    </div>
  );
}

function HoverDisplay({
  points,
  activeIndex,
}: {
  points: (Point | undefined)[];
  activeIndex?: number;
}) {
  const index = useMemo(() => {
    if (activeIndex != null) return activeIndex;

    return points.findIndex((p) => p?.status === 'active');
  }, [points, activeIndex]);

  const point = useMemo(() => points.at(index), [points, index]);

  return <PointDisplay point={point} />;
}

function PointDisplay({ point }: { point: Point | undefined }) {
  return (
    <>
      <b>{point?.label ?? '–'}</b>
      <div>{point?.y ?? '–'}p/kWh</div>
    </>
  );
}

const options: ChartOptions<'polarArea'> = {
  maintainAspectRatio: false,
  layout: {
    padding: 8,
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
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
};
