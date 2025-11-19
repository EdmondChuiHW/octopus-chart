import { Bar } from 'react-chartjs-2';
import type {
  ChartOptions,
  ChartData,
  Plugin,
  ChartDataset,
  Chart,
} from 'chart.js';
import type { PricePoint } from '../lib/pointUtils';
import { useCallback, useMemo, type ComponentProps } from 'react';
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
import useActiveChartIndex from '../hooks/useActiveChartIndex.ts';
import annotationPlugin from 'chartjs-plugin-annotation';
import { COLORS } from '../lib/constants.ts';

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
  annotationPlugin,
);

type Props = {
  points: PricePoint[];
  setHovering?: (isHovering: boolean) => void;
  onHover?: (index: number) => void;
  displayIndex: readonly [number, 'none' | 'default'];
};

export default function PriceChart({
  points,
  setHovering,
  onHover,
  displayIndex,
}: Props) {
  const data = useMemo<ChartData<'bar', PricePoint[], string>>(() => {
    const dataset: ChartDataset<'bar', PricePoint[]> = {
      label: 'p/kWh (inc VAT)',
      data: points,
      order: 2,
      barPercentage: 1.0,
      categoryPercentage: 1.0,
      borderRadius: 12,
      hoverBorderColor: 'rgba(0,120,212,0.95)',
      hoverBorderWidth: 4,
      borderWidth: 2,
      borderColor: 'rgba(0,0,0,0.9)',
      backgroundColor: (ctx) => {
        return points.at(ctx.dataIndex)?.backgroundColor;
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
        maDataset as unknown as ChartDataset<'bar', PricePoint[]>,
      ],
    };
  }, [points]);

  const ref = useActiveChartIndex<ChartJS<'bar'>>(displayIndex);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const chart = ref.current;
      if (!chart) return;

      const points = chart.getElementsAtEventForMode(
        event.nativeEvent,
        'x',
        { intersect: false },
        true,
      );

      const barPoints = points.filter((p) => p.datasetIndex === 0);

      if (barPoints.length === 1) {
        chart.setActiveElements([
          {
            datasetIndex: 0,
            index: barPoints[0].index,
          },
        ]);
        chart.update();
        onHover?.(barPoints[0].index);
      } else {
        onHover?.(-1);
      }
    },
    [onHover, ref],
  );

  return (
    <Bar
      ref={ref as ComponentProps<typeof Bar>['ref']}
      options={options}
      data={data}
      plugins={plugins}
      style={style}
      onPointerEnter={() => setHovering?.(true)}
      onPointerMove={handlePointerMove}
      onPointerOut={() => setHovering?.(false)}
    />
  );
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

function getPoints({ chart }: { chart: Chart }): PricePoint[] {
  return chart.data.datasets[0].data as PricePoint[];
}

function getActiveIndex({ chart }: { chart: Chart }): number {
  const activeElements = chart
    .getActiveElements()
    .filter((el) => el.datasetIndex === 0);
  if (activeElements.length !== 1) {
    return -1;
  }

  return activeElements[0].index;
}

function getActivePoint(ctx: { chart: Chart }): PricePoint | undefined {
  const i = getActiveIndex(ctx);
  return i >= 0 ? getPoints(ctx).at(i) : undefined;
}

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  events: [],
  hover: {},
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
    title: { display: false },
    annotation: {
      animations: {
        numbers: {
          properties: [],
          type: 'number',
        },
      },
      annotations: [
        {
          type: 'line',
          id: 'activeLine',
          drawTime: 'afterDraw',
          adjustScaleRange: false,
          borderColor: COLORS.PRIMARY_BLUE,
          display: (ctx) => getActiveIndex(ctx) >= 0,
          xMin: (ctx) => getActiveIndex(ctx),
          xMax: (ctx) => getActiveIndex(ctx),
          yMin: (ctx) => (getActivePoint(ctx)?.y ?? 0) * 1,
          borderWidth: (ctx) => (getActiveIndex(ctx) >= 0 ? 4 : 0),
          label: {
            display: (ctx) => getActiveIndex(ctx) >= 0,
            content: (ctx) => getActivePoint(ctx)?.label ?? '',
            position: 'end',
            backgroundColor: COLORS.PRIMARY_BLUE,
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold',
            },
          },
        },
      ],
    },
  },
  scales: {
    x: {
      // TODO use actual custom ID. Using built-in scale ID to lie to TS lol
      type: 'timeseries',
      ticks: {
        color: '#ffffff',
        autoSkip: false,
        align: 'end',
        callback(_val, index) {
          const points = getPoints(this);
          const point = index >= 0 ? points.at(index) : undefined;
          return point?.tickLabel;
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
