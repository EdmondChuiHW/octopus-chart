import { useEffect, useMemo, useState } from 'react';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import Controls from './Controls';
import PriceChart from './PriceChart';
import RateClock from './RateClock';
import { axisTickPluginFactory } from './chartPlugins/axisTickPlugin';
import { formatTimeLocal, getLocalDateKey } from '../lib/dateUtils';
import { incVatValue, buildStartEndMs } from '../lib/priceUtils';
import type { PricePoint } from '../lib/types';
import type {
  ChartOptions,
  ChartData,
  ChartDataset,
  TooltipItem,
} from 'chart.js';

const DEFAULT_PRODUCT = 'AGILE-24-10-01';
const DEFAULT_TARIFF = 'E-1R-AGILE-24-10-01-C';

export default function OctopusChart() {
  const [product, setProduct] = useState(DEFAULT_PRODUCT);
  const [tariff, setTariff] = useState(DEFAULT_TARIFF);
  const {
    data: points = [],
    isLoading,
    error,
    refetch,
  } = useOctopusPrices(product, tariff);

  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const labels = useMemo(
    () =>
      points.map(
        (p) =>
          `${formatTimeLocal(p.valid_from)}–${formatTimeLocal(p.valid_to)}`,
      ),
    [points],
  );
  const dataValues = useMemo(() => points.map((p) => incVatValue(p)), [points]);
  const backgroundColors = useMemo(
    () =>
      dataValues.map((_, i) => {
        const p = points[i];
        if (!p) return 'rgba(0,120,212,0.6)';
        const start = p.valid_from.getTime();
        const end = p.valid_to.getTime();
        if (nowMs >= start && nowMs < end) return 'rgba(255,205,86,0.95)';
        if (nowMs >= end) return 'rgba(0,120,212,0.28)';
        return 'rgba(0,120,212,0.95)';
      }),
    [dataValues, points, nowMs],
  );

  const { startMs, endMs } = buildStartEndMs(points);

  type ExtDataset = ChartDataset<'bar', number[]> & {
    startMs: number[];
    endMs: number[];
  };

  const data = useMemo((): ChartData<'bar', number[], string> => {
    const dataset: ExtDataset = {
      label: 'p/kWh (inc VAT)',
      data: dataValues,
      backgroundColor: backgroundColors,
      borderColor: backgroundColors,
      borderWidth: 1,
      startMs,
      endMs,
    };
    return { labels, datasets: [dataset] };
  }, [labels, dataValues, backgroundColors, startMs, endMs]);

  const todayKey = new Date(nowMs).toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
  });
  const tomorrowKey = new Date(nowMs + 24 * 3600 * 1000).toLocaleDateString(
    'en-GB',
    { timeZone: 'Europe/London' },
  );

  const dayMap = useMemo(() => {
    const map = new Map<string, PricePoint[]>();
    for (const p of points) {
      const k = getLocalDateKey(p.valid_from);
      const arr = map.get(k);
      if (arr) arr.push(p);
      else map.set(k, [p]);
    }
    return map;
  }, [points]);

  const segmentsForDay = (key: string) =>
    (dayMap.get(key) || [])
      .slice()
      .sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());

  const [hoverInfo, setHoverInfo] = useState<{
    label: string;
    value: number | null;
    x?: number;
    y?: number;
  } | null>(null);

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => items[0]?.label ?? '',
            label: (ctx: TooltipItem<'bar'>) => {
              const v = ctx.parsed.y;
              return v == null ? 'No data' : `${v} p/kWh (inc VAT)`;
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
            major: {
              enabled: true,
            },
            backdropColor: (ctx) => {
              const idx = Number(ctx.index);
              const start = startMs[idx];
              const end = endMs[idx];
              const isActive = nowMs >= start && nowMs < end;
              ctx.tick.major = isActive;
              return isActive ? '#ffd54f' : undefined;
            },
            showLabelBackdrop: (ctx) => {
              const idx = Number(ctx.index);
              const start = startMs[idx];
              const end = endMs[idx];
              return nowMs >= start && nowMs < end;
            },
            color: (ctx) => {
              const idx = Number(ctx.index);
              const start = startMs[idx];
              const end = endMs[idx];
              const isActive = nowMs >= start && nowMs < end;
              return isActive ? '#000000' : '#ffffff';
            },
            backdropPadding: 4,
            font: {
              size: (ctx) => {
                const idx = ctx.index;
                const start = startMs[idx];
                const end = endMs[idx];
                const isActive = nowMs >= start && nowMs < end;
                return isActive ? 14 : 12;
              },
              weight: (ctx) => {
                const idx = ctx.index;
                const start = startMs[idx];
                const end = endMs[idx];
                const isActive = nowMs >= start && nowMs < end;
                return isActive ? 700 : 400;
              },
            },
            autoSkip: false,
            align: 'center',
            callback: (_value, idx) => {
              const p = points[idx];
              if (!p) return '';
              const startDate = p.valid_from;
              const parts = startDate.toLocaleString('en-GB', {
                timeZone: 'Europe/London',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              const [hStr, mStr] = parts.split(':');
              const hour24 = Number(hStr);
              const minute = Number(mStr);
              const start = startDate.getTime();
              const end = p.valid_to.getTime();
              if (minute !== 0 && !(nowMs >= start && nowMs < end)) return '';
              const hour12 = ((hour24 + 11) % 12) + 1;
              const ampm = hour24 >= 12 ? 'pm' : 'am';
              if (minute !== 0 && nowMs >= start && nowMs < end) {
                const minuteStr = mStr.padStart(2, '0');
                return `${hour12}:${minuteStr}${ampm}`;
              }
              return `${hour12}${ampm}`;
            },
          },
          grid: { display: false },
        },
        y: {
          ticks: { color: '#ffffff', font: { size: 14 } },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
      },
    }),
    [points, nowMs, startMs, endMs],
  );

  return (
    <section className="octopus-section">
      <Controls
        product={product}
        tariff={tariff}
        setProduct={setProduct}
        setTariff={setTariff}
        onSubmit={(e) => {
          e.preventDefault();
          void refetch();
        }}
        isLoading={isLoading}
      />

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
              plugins={[axisTickPluginFactory(nowMs)]}
            />
          )}
        </div>
      )}

      <div className="clocks-row">
        <RateClock
          dateKey={todayKey}
          startHour={0}
          title="Today AM"
          segments={segmentsForDay(todayKey)}
          nowMs={nowMs}
          onHover={setHoverInfo}
        />
        <RateClock
          dateKey={todayKey}
          startHour={12}
          title="Today PM"
          segments={segmentsForDay(todayKey)}
          nowMs={nowMs}
          onHover={setHoverInfo}
        />
        <RateClock
          dateKey={tomorrowKey}
          startHour={0}
          title="Tomorrow AM"
          segments={segmentsForDay(tomorrowKey)}
          nowMs={nowMs}
          onHover={setHoverInfo}
        />
        <RateClock
          dateKey={tomorrowKey}
          startHour={12}
          title="Tomorrow PM"
          segments={segmentsForDay(tomorrowKey)}
          nowMs={nowMs}
          onHover={setHoverInfo}
        />
      </div>

      {hoverInfo ? (
        <div
          className="hover-panel"
          style={{
            position: 'absolute',
            left: hoverInfo.x ? hoverInfo.x + 8 : undefined,
            top: hoverInfo.y ? hoverInfo.y + 8 : undefined,
          }}
        >
          <div>
            <strong>{hoverInfo.label}</strong>
          </div>
          <div>
            {hoverInfo.value !== null
              ? `${hoverInfo.value} p/kWh (inc VAT)`
              : 'No data'}
          </div>
        </div>
      ) : null}

      <div className="note">
        Tip: slide or hover across bars to see the half-hour range and price.
        Tomorrow's day-ahead prices may become available after 16:00–20:00 local
        time.
      </div>
    </section>
  );
}
