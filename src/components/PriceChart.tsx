import { Bar } from 'react-chartjs-2';
import type {
  ChartOptions,
  ChartData,
  Plugin,
  Chart,
  ChartDataset,
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
  Filler,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
} from 'chart.js';
import useActiveChartIndex from '../hooks/useActiveChartIndex.ts';
import annotationPlugin, {
  type AnnotationOptions,
} from 'chartjs-plugin-annotation';
import { COLORS } from '../lib/colors';
import type { ConsumerBestTimes } from '../lib/types.ts';
import { formatShortDurationHoursMinsOnly } from '../lib/dateUtils.ts';

ChartJS.register(
  LinearScale,
  BarElement,
  Tooltip,
  Title,
  Legend,
  Filler,
  CategoryScale,
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
  consumerBestTimes?: ConsumerBestTimes[];
};

const DATASET_INDEX = {
  MAIN: 0,
  CONSUMER_BEST_TIMES: 1,
  LOWER_BOUND: 2,
  UPPER_BOUND: 3,
  PREDICTION: 4,
};

export default function PriceChart({
  points,
  setHovering,
  onHover,
  displayIndex,
  consumerBestTimes,
}: Props) {
  type Dataset =
    | ChartDataset<'bar', PricePoint[]>
    | ChartDataset<'line', (number | null)[]>;

  const datasets = useMemo(() => {
    const ret: Dataset[] = [];
    const barDataset: Dataset = {
      type: 'bar',
      label: 'p/kWh (inc VAT)',
      data: points,
      order: 2,
      barPercentage: 1.0,
      categoryPercentage: 1.0,
      borderRadius: 12,
      hoverBorderColor: (ctx: { dataIndex: number }) => {
        return points[ctx.dataIndex].isConfirmed
          ? 'rgba(0,120,212,0.95)'
          : 'transparent';
      },
      hoverBorderWidth: 4,
      borderWidth: (ctx: { dataIndex: number }) => {
        return points[ctx.dataIndex].isConfirmed ? 2 : 0;
      },
      borderColor: (ctx: { dataIndex: number }) => {
        return points[ctx.dataIndex].isConfirmed
          ? 'rgba(0,0,0,0.9)'
          : 'transparent';
      },
      backgroundColor: (ctx: { dataIndex: number }) => {
        return points[ctx.dataIndex].backgroundColor;
      },
    };
    ret[DATASET_INDEX.MAIN] = barDataset;

    if (consumerBestTimes) {
      const bestTimesByStartMs = new Map<
        number,
        { point: PricePoint; durationLabels: Set<string> }
      >();

      consumerBestTimes.forEach(({ config, bestStartTimePoints }) => {
        const best = bestStartTimePoints[0];
        const durationLabel = formatShortDurationHoursMinsOnly(config.duration);
        const existing = bestTimesByStartMs.get(best.x);

        if (existing) {
          existing.durationLabels.add(durationLabel);
        } else {
          bestTimesByStartMs.set(best.x, {
            point: best,
            durationLabels: new Set([durationLabel]),
          });
        }
      });

      const consumersDataset: Dataset = {
        type: 'bar',
        hidden: true,
        label: 'Consumer best time annotations',
        data: [...bestTimesByStartMs.values()].map(
          ({ point, durationLabels }) => ({
            ...point,
            label: `Best: ${[...durationLabels].join(', ')}`,
          }),
        ),
        backgroundColor: 'transparent',
      };
      ret[DATASET_INDEX.CONSUMER_BEST_TIMES] = consumersDataset;
    }

    if (points.some((p) => !p.isConfirmed)) {
      ret[DATASET_INDEX.LOWER_BOUND] = {
        type: 'line',
        label: 'Lower bound (p10)',
        data: points.map((p) => (!p.isConfirmed ? p.low : null)),
        borderColor: 'transparent',
        pointRadius: 0,
        fill: false,
        order: 1,
      };
      ret[DATASET_INDEX.UPPER_BOUND] = {
        type: 'line',
        label: 'Upper bound (p90)',
        data: points.map((p) => (!p.isConfirmed ? p.high : null)),
        borderColor: 'transparent',
        backgroundColor: 'rgba(195,155,211,0.4)',
        pointRadius: 0,
        fill: '-1',
        order: 1,
      };
      ret[DATASET_INDEX.PREDICTION] = {
        type: 'line',
        label: 'Prediction',
        data: points.map((p) => (!p.isConfirmed ? p.y : null)),
        borderColor: COLORS.PREDICTION,
        pointRadius: 0,
        fill: false,
        order: 3,
      };
    }

    return ret;
  }, [points, consumerBestTimes]);

  const data = useMemo(() => {
    return {
      labels: points.map((d) => d.label),
      datasets,
    } as unknown as ChartData<'bar'>;
  }, [datasets, points]);

  const options = useMemo<ChartOptions<'bar'>>(() => {
    const o = makeOptions();

    const consumerBestDatasetIdx = DATASET_INDEX.CONSUMER_BEST_TIMES;
    if (datasets.length <= consumerBestDatasetIdx) return o;

    const consumerBestDs = datasets[consumerBestDatasetIdx];

    const mainDs = datasets[DATASET_INDEX.MAIN];
    const bars = mainDs.type === 'bar' ? mainDs.data : [];

    const bestTimeAnnotations: AnnotationOptions<'label'>[] = [];
    const minVal = Math.min(0, ...bars.map((b) => b.y));

    const catIndexToTooltipLabel: Map<number, string> = new Map();
    (consumerBestDs.data as PricePoint[]).forEach(
      (point: PricePoint, i: number) => {
        const categoryIndex = bars.findIndex((b) => b.x === point.x);
        if (categoryIndex < 0) return;

        catIndexToTooltipLabel.set(categoryIndex, point.label);

        const dotColor = point.isConfirmed
          ? COLORS.PRIMARY_BLUE
          : COLORS.PREDICTION;
        const label: AnnotationOptions<'label'> = {
          type: 'label',
          id: `consumer-best-time-${point.x}-${i}`,
          drawTime: 'afterDraw',
          adjustScaleRange: false,
          display: (ctx) => getActiveIndex(ctx) !== categoryIndex,
          borderColor: dotColor,
          xMin: categoryIndex,
          xMax: categoryIndex,
          yMin: point.y,
          yMax: point.y,
          borderRadius: 6,
          content: '●',
          position: {
            x: 'center',
            y: 'end',
          },
          padding: 0,
          font: {
            size: 16,
            weight: 'bold',
          },
          color: dotColor,
        };

        bestTimeAnnotations.push(label);
      },
    );

    const annotations: AnnotationOptions[] = o.plugins.annotation.annotations;
    annotations.push(...bestTimeAnnotations);

    annotations.push({
      type: 'line',
      id: 'activeLine',
      drawTime: 'afterDraw',
      adjustScaleRange: false,
      borderColor: (ctx) => getActiveColor(ctx),
      display: (ctx) => getActiveIndex(ctx) >= 0,
      xMin: (ctx) => getActiveIndex(ctx),
      xMax: (ctx) => getActiveIndex(ctx),
      yMin: (ctx) => {
        const point = getActivePoint(ctx);
        if (!point) return minVal;
        if (point.isConfirmed) return point.y;
        return minVal;
      },
      // TODO: fix yMax protruding beyond label border radius
      borderWidth: (ctx) => (getActiveIndex(ctx) >= 0 ? 4 : 0),
      label: {
        display: (ctx) => getActiveIndex(ctx) >= 0,
        content: (ctx) => {
          const i = getActiveIndex(ctx);
          if (i < 0) return [];

          const barData = datasets[DATASET_INDEX.MAIN];
          const barPoints = barData.type === 'bar' ? barData.data : [];
          const p = barPoints[i] as PricePoint | undefined;
          if (!p) return [];

          const lines: string[] = [];
          if (p.isConfirmed) {
            lines.push(p.label, `${p.y.toFixed(2)}p/kWh`);
          } else {
            lines.push(
              `🔮${p.label}`,
              `${p.low.toFixed(2)}–${p.high.toFixed(2)}p/kWh`,
            );
          }
          const bestLabel = catIndexToTooltipLabel.get(i);
          if (bestLabel) lines.push(bestLabel);
          return lines;
        },
        position: 'end',
        backgroundColor: (ctx) => getActiveColor(ctx),
        color: '#ffffff',
        yAdjust: -6,
        padding: 6,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    });
    return o;
  }, [datasets]);

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

function getActiveColor(ctx: { chart: Chart }): string {
  const point = getActivePoint(ctx);
  return point && !point.isConfirmed ? COLORS.PREDICTION : COLORS.PRIMARY_BLUE;
}

function makeOptions() {
  return {
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
        annotations: [],
      },
    },
    layout: {
      padding: 0,
    },
    scales: {
      x: {
        type: 'category',
        ticks: {
          color: '#ffffff',
          autoSkip: true,
          align: 'end',
          padding: 0,
          callback(_val, index) {
            const points = getPoints(this);
            const point = index >= 0 ? points.at(index) : undefined;
            return point?.tickLabel;
          },
        },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#ffffff', font: { size: 14 }, padding: 0 },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
    },
  } satisfies ChartOptions<'bar'>;
}

const style: React.CSSProperties = {
  touchAction: 'pinch-zoom',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};
