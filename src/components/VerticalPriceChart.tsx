import { useMemo } from 'react';
import EChart from './EChart';
import {
  BASE_OPTION,
  type ChartOption,
  type MarkLineItem,
} from '../lib/echarts';
import { predictionSeries, priceCategoryAxes } from '../lib/chartHelpers';
import { COLORS } from '../lib/colors';
import { formatPrice, type PricePoint } from '../lib/pointUtils';
import { bestTimeLabels } from '../lib/priceUtils';
import type { ConsumerBestTime } from '../lib/types';
import './VerticalPriceChart.css';

const ROW_HEIGHT = 44;
const AXIS_WIDTH = 76; // room for "12pm" labels + ticks

export default function VerticalPriceChart({
  points,
  consumerBestTimes,
}: {
  points: PricePoint[];
  consumerBestTimes?: ConsumerBestTime[];
}) {
  const option = useMemo(
    () => buildOption(points, bestTimeLabels(consumerBestTimes)),
    [points, consumerBestTimes],
  );

  return (
    <div className="vertical-price-chart-container">
      <EChart option={option} style={{ height: points.length * ROW_HEIGHT }} />
    </div>
  );
}

function buildOption(
  points: PricePoint[],
  bestLabels: Map<number, string>,
): ChartOption {
  // Line along the top edge of each best-start row, with a tab hanging below
  // it on the right. Rows are exactly ROW_HEIGHT px, so position in pixels.
  const bestLines = points.flatMap((p, i): MarkLineItem[] => {
    const text = bestLabels.get(p.startMs);
    if (!text) return [];
    const y = i * ROW_HEIGHT + 2;
    return [
      [
        { x: AXIS_WIDTH, y },
        { x: '100%', y, label: { formatter: text } },
      ],
    ];
  });

  return {
    ...BASE_OPTION,
    grid: {
      left: AXIS_WIDTH,
      right: 0,
      top: 0,
      bottom: 0,
      outerBoundsMode: 'none',
    },
    xAxis: {
      type: 'value',
      show: false,
      min: Math.min(0, ...points.map((p) => p.low)),
      max: Math.max(...points.map((p) => p.high)),
    },
    yAxis: priceCategoryAxes(
      points,
      {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        verticalAlign: 'bottom',
        margin: 12,
      },
      { position: 'left', inverse: true },
    ),
    series: [
      {
        id: 'price',
        type: 'bar',
        barCategoryGap: '10%',
        silent: true,
        data: points.map((p) => ({
          value: p.isConfirmed ? p.price : p.high,
          itemStyle: {
            color: p.color,
            borderRadius: ROW_HEIGHT / 2,
            borderColor: COLORS.PRIMARY_BLUE,
            borderWidth: p.status === 'active' ? 4 : 0,
          },
        })),
        label: {
          show: true,
          position: 'insideLeft',
          distance: 8,
          formatter: ({ dataIndex }: { dataIndex: number }) =>
            formatPrice(points[dataIndex], 'p'),
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bolder',
          textBorderColor: 'black',
          textBorderWidth: 4,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: COLORS.PRIMARY_BLUE, width: 4, type: 'solid' },
          label: {
            position: 'insideEndBottom',
            distance: 0,
            color: '#fff',
            backgroundColor: COLORS.PRIMARY_BLUE,
            padding: [0, 8, 4, 8],
            borderRadius: [0, 0, 8, 8],
            fontSize: 20,
            fontWeight: 'bold',
          },
          data: bestLines,
        },
      },
      ...predictionSeries(points),
    ],
  } satisfies ChartOption;
}
