import { Bar } from 'react-chartjs-2';
import type { ChartOptions, ChartData, ChartDataset, Plugin } from 'chart.js';
import { useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  Tooltip,
  Title,
  Legend,
  CategoryScale,
} from 'chart.js';
import annotationPlugin, {
  type AnnotationOptions,
} from 'chartjs-plugin-annotation';
import type { PricePoint } from '../lib/pointUtils';
import type { ConsumerBestTimes } from '../lib/types';
import { COLORS } from '../lib/colors';
import { formatShortDurationHoursMinsOnly } from '../lib/dateUtils';
import './VerticalPriceChart.css';
import { axisTickPluginFactory } from './chartPlugins/axisTickPlugin';
import { setChartActiveIndex } from '../hooks/useActiveChartIndex';

ChartJS.register(
  LinearScale,
  BarElement,
  Tooltip,
  Title,
  Legend,
  CategoryScale,
  annotationPlugin,
);

const BAR_HEIGHT = 40;

const plugins: Plugin[] = [axisTickPluginFactory('y', 4)];

export default function VerticalPriceChart({
  points,
  consumerBestTimes,
}: {
  points: PricePoint[];
  consumerBestTimes?: ConsumerBestTimes[];
}) {
  const data = useMemo<ChartData<'bar', PricePoint[], string>>(() => {
    return {
      labels: points.map((point) => point.label),
      datasets: [
        {
          label: 'p/kWh (inc VAT)',
          data: points,
          backgroundColor: (ctx) => {
            return points.at(ctx.dataIndex)?.backgroundColor;
          },
          borderColor: (ctx) => {
            return points.at(ctx.dataIndex)?.borderColor ?? 'transparent';
          },
          borderWidth: (ctx) => {
            return points.at(ctx.dataIndex)?.status === 'active' ? 4 : 0;
          },
        } as ChartDataset<'bar', PricePoint[]>,
      ],
    };
  }, [points]);

  const priceAnnotations = useMemo<AnnotationOptions<'label'>[]>(
    () =>
      points.map((point, index) => ({
        type: 'label',
        id: `vertical-price-label-${point.x}-${index}`,
        drawTime: 'afterDraw',
        adjustScaleRange: false,
        xMin: 0,
        xMax: 0,
        yMin: index,
        yMax: index,
        borderRadius: 6,
        color: '#ffffff',
        textStrokeColor: 'black',
        textStrokeWidth: 6,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 18,
          weight: 'bolder',
        },
        padding: 0,
        content: `${point.y.toFixed(2)}p`,
        position: {
          x: 'start',
          y: 'center',
        },
        xAdjust: 4,
        display: true,
      })),
    [points],
  );

  const consumerBestTimeAnnotations = useMemo<
    AnnotationOptions<'label'>[]
  >(() => {
    if (!consumerBestTimes?.length) return [];

    const durationLabelByStartMs = new Map<number, Set<string>>();
    consumerBestTimes.forEach(({ config, bestStartTimePoints }) => {
      const firstBest = bestStartTimePoints[0];
      const durationLabel = formatShortDurationHoursMinsOnly(config.duration);
      const existing = durationLabelByStartMs.get(firstBest.startMs);
      if (existing) {
        existing.add(durationLabel);
      } else {
        durationLabelByStartMs.set(firstBest.startMs, new Set([durationLabel]));
      }
    });

    const annotations: AnnotationOptions<'label'>[] = [];
    points.forEach((point, index) => {
      const labels = durationLabelByStartMs.get(point.startMs);
      if (!labels?.size) return;

      const content = 'Best: ' + [...labels].join(', ');

      annotations.push({
        type: 'label',
        id: `vertical-consumer-best-time-${point.x}-${index}`,
        drawTime: 'afterDraw',
        adjustScaleRange: true,
        xMin: point.y,
        xMax: point.y,
        yMin: index,
        yMax: index,
        borderRadius: 6,
        backgroundColor: COLORS.PRIMARY_BLUE,
        borderColor: 'transparent',
        borderWidth: 0,
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          x: 8,
          y: 4,
        },
        content,
        position: {
          x: 'start',
          y: 'center',
        },
        xAdjust: 8,
        display: true,
      });
    });

    return annotations;
  }, [consumerBestTimes, points]);

  const annotations = useMemo<AnnotationOptions<'label'>[]>(
    () => [...priceAnnotations, ...consumerBestTimeAnnotations],
    [priceAnnotations, consumerBestTimeAnnotations],
  );

  const options = useMemo<ChartOptions<'bar'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      events: [],
      hover: {},
      parsing: {
        xAxisKey: 'y',
        yAxisKey: 'x',
      },
      layout: {
        padding: 0,
      },
      borderRadius: BAR_HEIGHT / 2,
      barPercentage: 0.95,
      categoryPercentage: 0.95,
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
          annotations,
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          type: 'category',
          ticks: {
            color: '#ffffff',
            font: { size: 16 },
            callback(value) {
              const index = Number(value);
              const point = points.at(index);
              return point?.tickLabel;
            },
            align: 'end',
            labelOffset: -10,
            includeBounds: true,
            padding: 8,
          },
          grid: { display: false },
        },
      },
    };
  }, [annotations, points]);
  const chartHeight = points.length * BAR_HEIGHT;

  const chartRef = useRef(null);
  useEffect(() => {
    const activeIndex = points.findIndex((p) => p.status === 'active');
    setChartActiveIndex(chartRef.current, activeIndex);
  }, [points]);

  return (
    <div className="vertical-price-chart-container">
      <div style={{ position: 'relative', height: chartHeight }}>
        <Bar options={options} data={data} plugins={plugins} ref={chartRef} />
      </div>
    </div>
  );
}
