import { useEffect, useMemo, useState } from 'react';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import PriceChart from './PriceChart';
import RateClock from './RateClock';
import { axisTickPluginFactory } from './chartPlugins/axisTickPlugin';
import { buildPointsData, type Point } from '../lib/pointUtils';
import type {
  ChartOptions,
  ChartData,
  ChartDataset,
  TooltipItem,
  Chart,
} from 'chart.js';
import { TIMINGS } from '../lib/constants';
import { addDays } from 'date-fns';

const DEFAULT_PRODUCT = 'AGILE-24-10-01';
const DEFAULT_TARIFF = 'E-1R-AGILE-24-10-01-C';

export default function OctopusChart() {
  const product = DEFAULT_PRODUCT;
  const tariff = DEFAULT_TARIFF;
  const {
    data: points = [],
    isLoading,
    error,
  } = useOctopusPrices(product, tariff);

  const nowMs = useNowMs();
  const todayKey = nowMs;
  const tomorrowKey = addDays(nowMs, 1).getTime();

  const dataPoints = useMemo(
    () => buildPointsData(points, nowMs),
    [points, nowMs],
  );

  const data = useMemo<ChartData<'bar', Point[], string>>(() => {
    const dataset: ChartDataset<'bar', Point[]> = {
      label: 'p/kWh (inc VAT)',
      data: dataPoints,
      borderRadius: 12,
      // supply per-datum colors as arrays derived from dataPoints
      backgroundColor: (ctx) => {
        return dataPoints.at(ctx.dataIndex)?.backgroundColor;
      },
      borderColor: (ctx) => {
        return dataPoints.at(ctx.dataIndex)?.borderColor;
      },
      borderWidth: (ctx) => {
        return dataPoints.at(ctx.dataIndex)?.borderColor != null
          ? 2
          : undefined;
      },
    };
    return { labels: dataPoints.map((d) => d.label), datasets: [dataset] };
  }, [dataPoints]);

  return (
    <>
      {error ? (
        <div role="alert" className="error">
          Error: {error instanceof Error ? error.message : String(error)}
        </div>
      ) : (
        <div className="chart-wrap" aria-busy={isLoading}>
          {points.length === 0 && !isLoading ? (
            <div className="placeholder">
              No price data available for the selected tariff / period.
            </div>
          ) : (
            <PriceChart
              data={data}
              options={options}
              plugins={[axisTickPluginFactory()]}
            />
          )}
        </div>
      )}

      <div className="clocks-row">
        <RateClock
          dateKey={todayKey}
          startHourOfDay={0}
          title="Today AM"
          points={dataPoints}
          nowMs={nowMs}
        />
        <RateClock
          dateKey={todayKey}
          startHourOfDay={12}
          title="Today PM"
          points={dataPoints}
          nowMs={nowMs}
        />
        <RateClock
          dateKey={tomorrowKey}
          startHourOfDay={0}
          title="Tomorrow AM"
          points={dataPoints}
          nowMs={nowMs}
        />
        <RateClock
          dateKey={tomorrowKey}
          startHourOfDay={12}
          title="Tomorrow PM"
          points={dataPoints}
          nowMs={nowMs}
        />
      </div>

      <div className="note">
        Tip: slide or hover across bars to see the half-hour range and price.
        Tomorrow's day-ahead prices may become available after 16:00–20:00 local
        time.
      </div>
    </>
  );
}

function useNowMs(): number {
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(
      () => setNowMs(Date.now()),
      TIMINGS.NOW_UPDATE_INTERVAL,
    );
    return () => clearInterval(id);
  }, []);

  return nowMs;
}

function getPoints({ chart }: { chart: Chart }): Point[] {
  return chart.data.datasets[0].data as Point[];
}

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
