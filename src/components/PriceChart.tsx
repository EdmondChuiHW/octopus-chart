import { Bar } from 'react-chartjs-2';
import type {
  ChartOptions,
  ChartData,
  Plugin,
  ChartDataset,
  Chart,
  TooltipItem,
} from 'chart.js';
import type { PricePoint } from '../lib/pointUtils';
import { useMemo } from 'react';
import { axisTickPluginFactory } from './chartPlugins/axisTickPlugin';
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  Tooltip,
  Title,
  Legend,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js';
import { MyBarScale } from './MyBarScale.ts';

ChartJS.register(
  LinearScale,
  BarElement,
  Tooltip,
  Title,
  Legend,
  MyBarScale,
  LineController,
  LineElement,
  PointElement,
);

type Props = {
  points: PricePoint[];
};

export default function PriceChart({ points }: Props) {
  const data = useMemo<
    ChartData<'bar', (PricePoint | undefined)[], string>
  >(() => {
    const dataset: ChartDataset<'bar', PricePoint[]> = {
      label: 'p/kWh (inc VAT)',
      data: points,
      order: 2,
      borderRadius: 12,
      backgroundColor: (ctx) => {
        return points.at(ctx.dataIndex)?.backgroundColor;
      },
      borderColor: (ctx) => {
        return points.at(ctx.dataIndex)?.borderColor;
      },
      borderWidth: (ctx) => {
        return points.at(ctx.dataIndex)?.borderColor != null ? 2 : undefined;
      },
    };

    // compute 3-hour moving average (include current point and previous points within 3 hours)
    const movingAvg = computeMovingAverage(points, 3 * 60 * 60 * 1000);

    const maDataset = {
      type: 'line',
      label: '3h MA',
      data: movingAvg,
      order: 1,
      borderColor: 'rgba(255,255,255,0.9)',
      borderWidth: 2,
      tension: 0.25,
      pointRadius: 0,
      yAxisID: 'y',
    } as ChartDataset<'line', (number | undefined)[]>;

    return {
      labels: points.map((d) => d.label),
      datasets: [
        dataset,
        maDataset as unknown as ChartDataset<'bar', (PricePoint | undefined)[]>,
      ],
    };
  }, [points]);

  return <Bar options={options} data={data} plugins={plugins} style={style} />;
}

function getPoints({ chart }: { chart: Chart }): PricePoint[] {
  return chart.data.datasets[0].data as PricePoint[];
}

/**
 * Compute moving average over a sliding time window (in ms).
 * For each point i, average y-values of points with startMs >= points[i].startMs - windowMs + 1 and <= points[i].startMs
 */
function computeMovingAverage(
  points: PricePoint[],
  windowMs: number,
): (number | undefined)[] {
  const n = points.length;
  const out: (number | undefined)[] = Array<number | undefined>(n);
  if (n === 0) return out;

  // Forward-looking sliding window: for each index i, average points with
  // startMs in [points[i].startMs, points[i].startMs + windowMs)
  let right = 0;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    // remove the previous element from sum (we want window starting at i)
    if (i > 0) {
      sum -= points[i - 1].y;
    }

    // ensure right is at least i
    if (right < i) right = i;

    const windowEnd = points[i].startMs + windowMs - 1;
    while (right < n && points[right].startMs <= windowEnd) {
      sum += points[right].y;
      right++;
    }

    const count = right - i;
    out[i] = count > 0 ? sum / count : undefined;
  }

  return out;
}

const plugins: Plugin[] = [axisTickPluginFactory()];

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => {
          const v = ctx.parsed.y;
          return v == null ? 'No data' : `${v.toFixed(2)}p/kWh`;
        },
      },
      bodyFont: { size: 16 },
      titleFont: { size: 14 },
    },
    title: { display: false },
  },
  scales: {
    x: {
      // TODO use actual custom ID. Using built-in scale ID to lie to TS lol
      type: 'timeseries',

      ticks: {
        color: '#ffffff',
        backdropPadding: 4,
        autoSkip: false,
        align: 'center',
        backdropColor: (ctx) => {
          const pointsIndex = ctx.tick.value;
          return getPoints(ctx).at(pointsIndex)?.status === 'active'
            ? 'rgba(0,120,212,0.95)'
            : undefined;
        },
        showLabelBackdrop: (ctx) => {
          const pointsIndex = ctx.tick.value;
          return getPoints(ctx).at(pointsIndex)?.status === 'active';
        },
        font: {
          size: (ctx) => {
            const pointsIndex = ctx.tick.value;
            return getPoints(ctx).at(pointsIndex)?.status === 'active'
              ? 14
              : 12;
          },
          weight: (ctx) => {
            const pointsIndex = ctx.tick.value;
            return getPoints(ctx).at(pointsIndex)?.status === 'active'
              ? 700
              : 400;
          },
        },
        callback(_val, index) {
          return getPoints(this).at(index)?.tickLabel;
        },
      },
      grid: { display: false },
    },
    y: {
      ticks: { color: '#ffffff', font: { size: 14 } },
      grid: { color: 'rgba(255,255,255,0.08)' },
    },
  },
};

const style: React.CSSProperties = {
  touchAction: 'pinch-zoom',
};
