import { useMemo, type PointerEvent } from 'react';
import EChart from './EChart';
import {
  BASE_OPTION,
  getInstanceByDom,
  type ChartOption,
  type MarkLineItem,
  type MarkPointItem,
} from '../lib/echarts';
import {
  barIndexAtPixel,
  predictionSeries,
  priceCategoryAxes,
} from '../lib/chartHelpers';
import { COLORS } from '../lib/colors';
import { formatPrice, type PricePoint } from '../lib/pointUtils';
import { bestTimeLabels } from '../lib/priceUtils';
import type { ConsumerBestTime } from '../lib/types';

type Props = {
  points: PricePoint[];
  /** Highlighted bar (hovered here or on a clock, or the current slot). */
  activeIndex: number;
  consumerBestTimes?: ConsumerBestTime[];
  onHover?: (index: number) => void;
  setHovering?: (isHovering: boolean) => void;
};

export default function PriceChart({
  points,
  activeIndex,
  consumerBestTimes,
  onHover,
  setHovering,
}: Props) {
  const bestLabels = useMemo(
    () => bestTimeLabels(consumerBestTimes),
    [consumerBestTimes],
  );
  const option = useMemo(
    () => buildOption(points, activeIndex, bestLabels),
    [points, activeIndex, bestLabels],
  );

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const chart = getInstanceByDom(e.currentTarget);
    if (!chart) return;
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    onHover?.(barIndexAtPixel(chart, x, points.length));
  }

  return (
    <EChart
      option={option}
      style={STYLE}
      onPointerEnter={() => setHovering?.(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHovering?.(false)}
    />
  );
}

const STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  touchAction: 'pinch-zoom',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

const GRID_TOP = 4;

function buildOption(
  points: PricePoint[],
  activeIndex: number,
  bestLabels: Map<number, string>,
): ChartOption {
  const active = activeIndex >= 0 ? points.at(activeIndex) : undefined;
  const accent =
    active && !active.isConfirmed ? COLORS.PREDICTION : COLORS.PRIMARY_BLUE;
  const minVal = Math.min(0, ...points.map((p) => p.low));

  const bestDots = points.flatMap((p, i): MarkPointItem[] =>
    bestLabels.has(p.startMs) && i !== activeIndex
      ? [
          {
            name: 'best',
            coord: [i, p.price], // bar top, or the prediction line
            symbol: 'circle',
            symbolSize: 10,
            symbolOffset: [0, -8],
            itemStyle: {
              color: p.isConfirmed ? COLORS.PRIMARY_BLUE : COLORS.PREDICTION,
            },
            label: { show: false },
          },
        ]
      : [],
  );

  let activeMarkers: { line: MarkLineItem[]; label: MarkPointItem[] } = {
    line: [],
    label: [],
  };
  if (active) {
    const best = bestLabels.get(active.startMs);
    const lines = [
      active.isConfirmed ? active.label : `🔮${active.label}`,
      formatPrice(active),
      ...(best ? [`Best: ${best}`] : []),
    ];
    // Keep the label on screen near the edges.
    const edge = activeIndex / points.length;
    activeMarkers = {
      line: [
        [
          { coord: [activeIndex, active.isConfirmed ? active.price : minVal] },
          { coord: [activeIndex, 0], y: GRID_TOP }, // up to the top of the grid
        ],
      ],
      label: [
        {
          name: 'active',
          coord: [activeIndex, 0],
          y: GRID_TOP - 2, // pinned to the top of the chart
          symbolSize: 0,
          label: {
            show: true,
            position: 'bottom',
            distance: 0,
            align: edge < 0.12 ? 'left' : edge > 0.88 ? 'right' : 'center',
            formatter: lines.join('\n'),
            backgroundColor: accent,
            color: '#fff',
            padding: 6,
            borderRadius: 6,
            fontSize: 16,
            lineHeight: 20,
            fontWeight: 'bold',
          },
        },
      ],
    };
  }

  return {
    ...BASE_OPTION,
    grid: { left: 0, right: 0, top: GRID_TOP, bottom: 0 },
    xAxis: priceCategoryAxes(points, { color: '#fff' }, { position: 'bottom' }),
    yAxis: {
      type: 'value',
      axisLabel: { color: '#fff', fontSize: 14 },
      splitLine: { lineStyle: { color: COLORS.GRID } },
    },
    series: [
      {
        id: 'price',
        type: 'bar',
        barCategoryGap: '0%',
        silent: true,
        data: points.map((p, i) => ({
          value: p.isConfirmed ? p.price : '-',
          itemStyle: {
            color: p.color,
            borderColor:
              i === activeIndex ? COLORS.PRIMARY_BLUE : COLORS.BAR_BORDER,
            borderWidth: i === activeIndex ? 4 : 2,
            borderRadius: [12, 12, 0, 0],
          },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: accent, width: 4, type: 'solid' },
          data: activeMarkers.line,
        },
        markPoint: {
          silent: true,
          data: [...bestDots, ...activeMarkers.label],
        },
      },
      ...predictionSeries(points),
    ],
  } satisfies ChartOption;
}
