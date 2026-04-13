import { Bar } from 'react-chartjs-2';
import type { ChartOptions, ChartData, ChartDataset } from 'chart.js';
import { useMemo } from 'react';
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
import './VerticalPriceChart.css';

ChartJS.register(
  LinearScale,
  BarElement,
  Tooltip,
  Title,
  Legend,
  CategoryScale,
  annotationPlugin,
);

const BAR_HEIGHT = 36;

export default function VerticalPriceChart({
  points,
}: {
  points: PricePoint[];
}) {
  const data = useMemo<ChartData<'bar', number[], string>>(() => {
    return {
      labels: points.map((point) => point.label),
      datasets: [
        {
          label: 'p/kWh (inc VAT)',
          data: points.map((point) => point.y),
          backgroundColor: points.map((point) => point.backgroundColor),
          borderColor: points.map(
            (point) => point.borderColor ?? 'transparent',
          ),
          borderWidth: points.map((point) =>
            point.status === 'active' ? 4 : 0,
          ),
        } as ChartDataset<'bar', number[]>,
      ],
    };
  }, [points]);

  const annotations = useMemo<AnnotationOptions<'label'>[]>(
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
        backgroundColor: 'transparent',
        color: '#ffffff',
        textStrokeColor: 'black',
        textStrokeWidth: 4,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 0,
        content: `${point.y.toFixed(2)}p`,
        position: {
          x: 'start',
          y: 'center',
        },
        xAdjust: 12,
        display: true,
      })),
    [points],
  );

  const options = useMemo<ChartOptions<'bar'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      events: [],
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
          ticks: {
            color: '#ffffff',
            font: { size: 16 },
            callback(value) {
              const index = Number(value);
              const point = points.at(index);
              return point?.tickLabel;
            },
          },
          grid: { display: false },
        },
      },
    };
  }, [annotations, points]);
  const chartHeight = points.length * BAR_HEIGHT;

  return (
    <div className="vertical-price-chart-container">
      <div style={{ position: 'relative', height: chartHeight }}>
        <Bar options={options} data={data} />
      </div>
    </div>
  );
}
