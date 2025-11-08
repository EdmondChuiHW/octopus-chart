import { Bar } from 'react-chartjs-2';
import type {
  ChartOptions,
  ChartData,
  Plugin,
  ChartDataset,
  Chart,
  TooltipItem,
} from 'chart.js';
import type { Point } from '../lib/pointUtils';
import { useMemo } from 'react';
import { axisTickPluginFactory } from './chartPlugins/axisTickPlugin';

type Props = {
  points: Point[];
};

export default function PriceChart({ points }: Props) {
  const data = useMemo<ChartData<'bar', Point[], string>>(() => {
    const dataset: ChartDataset<'bar', Point[]> = {
      label: 'p/kWh (inc VAT)',
      data: points,
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
    return { labels: points.map((d) => d.label), datasets: [dataset] };
  }, [points]);

  return <Bar options={options} data={data} plugins={plugins} style={style} />;
}

function getPoints({ chart }: { chart: Chart }): Point[] {
  return chart.data.datasets[0].data as Point[];
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
          return v == null ? 'No data' : `${v}p/kWh`;
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
