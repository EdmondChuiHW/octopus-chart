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
  CategoryScale,
} from 'chart.js';
import useActiveChartIndex from '../hooks/useActiveChartIndex.ts';
import annotationPlugin, {
  type AnnotationOptions,
} from 'chartjs-plugin-annotation';
import { COLORS } from '../lib/constants.ts';
import type { ConsumerBestTimes } from '../lib/types.ts';
import { formatShortDurationHoursMinsOnly } from '../lib/dateUtils.ts';

ChartJS.register(
  LinearScale,
  BarElement,
  Tooltip,
  Title,
  Legend,
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
};

export default function PriceChart({
  points,
  setHovering,
  onHover,
  displayIndex,
  consumerBestTimes,
}: Props) {
  const datasets = useMemo<ChartDataset<'bar', PricePoint[]>[]>(() => {
    const ret = [];
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
    ret[DATASET_INDEX.MAIN] = dataset;

    if (!consumerBestTimes) {
      return ret;
    }

    const consumersDataset: ChartDataset<'bar', PricePoint[]> = {
      hidden: true,
      label: 'Consumer best time annotations',
      data: consumerBestTimes.map(({ config, bestStartTimePoints }) => {
        const best = bestStartTimePoints[0];
        return {
          ...best,
          label: `Best: ${formatShortDurationHoursMinsOnly(config.duration)}`,
        };
      }),
    };
    ret[DATASET_INDEX.CONSUMER_BEST_TIMES] = consumersDataset;

    return ret;
  }, [points, consumerBestTimes]);

  const data = useMemo<ChartData<'bar', PricePoint[], string>>(() => {
    return {
      labels: points.map((d) => d.label),
      datasets: datasets,
    };
  }, [points, datasets]);

  const options = useMemo<ChartOptions<'bar'>>(() => {
    const o = makeOptions();

    if (!datasets[DATASET_INDEX.CONSUMER_BEST_TIMES]) return o;

    const bars = datasets[DATASET_INDEX.MAIN].data;

    const bestTimeAnnotations: AnnotationOptions<'label'>[] = [];

    datasets[DATASET_INDEX.CONSUMER_BEST_TIMES].data.forEach((point, i) => {
      const categoryIndex = bars.findIndex((b) => b.x === point.x);
      if (categoryIndex < 0) return;

      const label: AnnotationOptions<'label'> = {
        type: 'label',
        id: `consumer-best-time-${point.label}-${i}`,
        drawTime: 'afterDraw',
        adjustScaleRange: false,
        display: true,
        // TODO: handle multiple best times at the same category index
        borderColor: COLORS.PRIMARY_BLUE,
        xMin: categoryIndex,
        xMax: categoryIndex,
        yMin: point.y,
        yMax: point.y,
        borderRadius: 6,
        content: (ctx) =>
          getActiveIndex(ctx) === categoryIndex ? point.label : '●',
        z: (ctx) => (getActiveIndex(ctx) === categoryIndex ? 1 : 0),
        position: {
          x: 'center',
          y: 'end',
        },
        yAdjust: (ctx) => (getActiveIndex(ctx) === categoryIndex ? -24 : 0),
        padding: (ctx) => (getActiveIndex(ctx) === categoryIndex ? 6 : 0),
        font: {
          size: 16,
          weight: 'bold',
        },
        backgroundColor: (ctx) =>
          getActiveIndex(ctx) === categoryIndex
            ? COLORS.PRIMARY_BLUE
            : 'transparent',
        color: (ctx) =>
          getActiveIndex(ctx) === categoryIndex
            ? '#ffffff'
            : COLORS.PRIMARY_BLUE,
      };

      bestTimeAnnotations.push(label);
    });

    const annotations: AnnotationOptions[] = o.plugins.annotation.annotations;
    annotations.push(...bestTimeAnnotations);
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
            yMin: (ctx) => getActivePoint(ctx)?.y ?? 0,
            // TODO: fix yMax protruding beyond label border radius
            borderWidth: (ctx) => (getActiveIndex(ctx) >= 0 ? 4 : 0),
            label: {
              display: (ctx) => getActiveIndex(ctx) >= 0,
              content: (ctx) => {
                const p = getActivePoint(ctx);
                if (!p) return '';

                return [p.label, `${p.y.toFixed(2)}p/kWh`];
              },
              position: 'end',
              backgroundColor: COLORS.PRIMARY_BLUE,
              color: '#ffffff',
              yAdjust: -6,
              padding: 6,
              font: {
                size: 16,
                weight: 'bold',
              },
            },
          },
        ],
      },
    },
    scales: {
      x: {
        type: 'category',
        ticks: {
          color: '#ffffff',
          autoSkip: true,
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
  } satisfies ChartOptions<'bar'>;
}

const style: React.CSSProperties = {
  touchAction: 'pinch-zoom',
};
