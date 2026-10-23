/* Renders the app's ECharts charts to PNG in Node (no browser needed): initial load,
 * hover on the bar chart, hover on a clock, predictions on. Also checks that
 * merged option updates (what EChart.tsx does) match fresh renders.
 * Run: pnpm screenshots   ->   screenshots/after/*.png */
import { vi, test, beforeAll, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { NOW, octopusResponse, forecastResponse } from './fixture';
import { composePage, writePng, type Tile } from './page';

type Captured = {
  option: any;
  style?: { height?: number };
  className?: string;
};
const captured: Captured[] = [];
vi.mock('../../src/components/EChart', () => ({
  default: (props: Captured) => {
    captured.push(props);
    return null;
  },
}));
// RateClock keeps the pointer angle (clock hand) in useState; let the harness inject it.
let injectedPointerHours: number | null = null;
vi.mock('react', async (orig) => {
  const React = await orig<typeof import('react')>();
  return {
    ...React,
    useState: (init: unknown) =>
      injectedPointerHours != null && init === null
        ? [injectedPointerHours, () => {}]
        : React.useState(init),
  };
});

const { init } = await import('../../src/lib/echarts');
const { barIndexAtPixel, clockSlotAt } =
  await import('../../src/lib/chartHelpers');
const { default: OctopusCharts } =
  await import('../../src/components/OctopusCharts');
const { default: PriceChart } = await import('../../src/components/PriceChart');
const { default: VerticalPriceChart } =
  await import('../../src/components/VerticalPriceChart');
const { default: RateClock } = await import('../../src/components/RateClock');
const { buildPoints } = await import('../../src/lib/pointUtils');
const { findLowestPeriod } = await import('../../src/lib/priceUtils');
const { CHART_DATA, MS } = await import('../../src/lib/constants');
const { OctopusResponseSchema, AgileForecastResponseSchema } =
  await import('../../src/lib/types');

const OUT = `${__dirname}/../../screenshots/after`;
(globalThis as any).window = { location: { href: 'https://agile.example/' } };

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

// Same transformation as fetchOctopusPrices / fetchAgileForecast.
const slots = () =>
  OctopusResponseSchema.parse(octopusResponse())
    .results.map((r) => ({
      startMs: Date.parse(r.valid_from),
      endMs: Date.parse(r.valid_to),
      price: r.value_inc_vat,
    }))
    .sort((a, b) => a.startMs - b.startMs);
const forecast = () =>
  AgileForecastResponseSchema.parse(forecastResponse())[0].prices.map((p) => ({
    startMs: Date.parse(p.date_time),
    price: p.agile_pred,
    low: p.agile_low,
    high: p.agile_high,
  }));
const points = (withPredictions: boolean) =>
  buildPoints(slots(), NOW, withPredictions ? forecast() : undefined);

function capture(el: ReactElement): Captured[] {
  captured.length = 0;
  const qc = new QueryClient();
  qc.setQueryData(
    ['prices', CHART_DATA.DEFAULT_PRODUCT, CHART_DATA.DEFAULT_TARIFF],
    slots(),
  );
  renderToString(<QueryClientProvider client={qc}>{el}</QueryClientProvider>);
  return [...captured];
}

function draw(c: Captured, w: number, h: number, bg = '#001a26') {
  const chart = init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: w,
    height: h,
  });
  chart.setOption(c.option);
  const svg = chart
    .renderToSVGString()
    .replace(
      /<svg([^>]*)>/,
      `<svg$1><rect width="100%" height="100%" fill="${bg}"/>`,
    );
  return { svg, chart };
}

const CONSUMER_DURATIONS = [
  { name: 'Washer [Power Wash 60]', duration: { hours: 1, minutes: 0 } },
  { name: 'Washer [Cotton Eco]', duration: { hours: 2, minutes: 25 } },
  { name: 'Dishwasher', duration: { hours: 3 } },
];
function consumersFor(pts: ReturnType<typeof points>) {
  const upcoming = pts.filter((p) => p.startMs > NOW);
  return CONSUMER_DURATIONS.map(({ name, duration }) => {
    const i = findLowestPeriod(
      upcoming,
      (p) => p.price,
      Math.ceil((duration.hours * 60 + (duration.minutes ?? 0)) / 30),
    );
    return {
      config: { name, duration, timers: [] },
      bestStartMs: upcoming.at(Math.max(i, 0))?.startMs,
    };
  });
}

const W = 868,
  BAR_H = 140,
  CLOCK = 300;
const today = NOW,
  tomorrow = NOW + MS.PER_DAY;
const clockDefs = [
  { key: today, start: 0 as const, am: true },
  { key: today, start: 12 as const, am: false },
  { key: tomorrow, start: 0 as const, am: true },
  { key: tomorrow, start: 12 as const, am: false },
];

function clockTile(
  c: Captured | undefined,
  def: (typeof clockDefs)[number],
  pts: ReturnType<typeof points>,
  global: number,
): Tile {
  const bg = def.am ? 'rgba(255,255,255,0.85)' : '#001a26';
  if (!c) {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${CLOCK}" height="${CLOCK}"><text x="150" y="150" font-size="18" font-weight="bold" text-anchor="middle" fill="${def.am ? '#04202a' : '#fff'}" font-family="DejaVu Sans">No data for ${def.am ? 'AM' : 'PM'}</text></svg>`,
      w: CLOCK,
      h: CLOCK,
      panel: def.am ? 'am' : 'pm',
    };
  }
  const start = new Date(def.key);
  start.setHours(def.start, 0, 0, 0);
  const p =
    global >= 0 &&
    pts[global].startMs >= start.getTime() &&
    pts[global].startMs < start.getTime() + 12 * MS.PER_HOUR
      ? pts[global]
      : undefined;
  return {
    svg: draw(c, CLOCK, CLOCK, bg).svg,
    w: CLOCK,
    h: CLOCK,
    panel: def.am ? 'am' : 'pm',
    corner: {
      top: p ? p.label.toUpperCase() : def.am ? 'AM' : 'PM',
      bottom: p ? `${p.price.toFixed(2)}p/kWh` : undefined,
    },
  };
}

async function renderState(
  name: string,
  heading: string,
  opts: {
    predictions: boolean;
    displayIndex: number;
    pointer?: { clock: number; hours: number };
  },
) {
  const pts = points(opts.predictions);
  const consumers = consumersFor(pts);
  const [bar] = capture(
    <PriceChart
      points={pts}
      activeIndex={opts.displayIndex}
      consumerBestTimes={consumers}
    />,
  );
  const [vertical] = capture(
    <VerticalPriceChart points={pts} consumerBestTimes={consumers} />,
  );
  const clocks = clockDefs.map((d, i) => {
    injectedPointerHours =
      opts.pointer?.clock === i ? opts.pointer.hours : null;
    const [c] = capture(
      <RateClock
        dateKey={d.key}
        startHourOfDay={d.start}
        points={pts}
        displayIndex={opts.displayIndex}
        consumerBestTimes={consumers}
      />,
    );
    injectedPointerHours = null;
    return c;
  });
  const vh = vertical.style!.height!;
  const page = composePage(heading, [
    { tiles: [{ svg: draw(bar, W, BAR_H).svg, w: W, h: BAR_H }] },
    {
      title: 'All periods',
      subtitle: '(scrollable list, first 405px shown)',
      cropH: 405,
      tiles: [{ svg: draw(vertical, W, vh).svg, w: W, h: vh }],
    },
    {
      title: 'Today',
      tiles: clocks
        .slice(0, 2)
        .map((c, i) => clockTile(c, clockDefs[i], pts, opts.displayIndex)),
    },
    {
      title: 'Tomorrow',
      tiles: clocks
        .slice(2)
        .map((c, i) => clockTile(c, clockDefs[i + 2], pts, opts.displayIndex)),
    },
  ]);
  await writePng(`${OUT}/${name}.png`, page);
  return { pts, bar, vertical, clocks };
}

test('after: initial page + timer hint charts', async () => {
  const all = capture(<OctopusCharts />);
  const hints = all.filter((c) => c.className === 'start-time-hint-chart');
  expect(all.length).toBe(1 + 1 + 3 + hints.length); // bar + vertical + 3 clocks with data + hints
  const tiles = hints.map((c) => ({
    svg: draw(c, 400, 148).svg,
    w: 400,
    h: 148,
  }));
  const pts = points(false);
  const active = pts.findIndex((p) => p.status === 'active');
  await renderState('1-initial', 'Agile Octopus (London) — initial load', {
    predictions: false,
    displayIndex: active,
  });
  await writePng(
    `${OUT}/2-timer-hints.png`,
    composePage('Best periods — timer hint charts', [{ tiles }]),
  );
});

test('after: hover interactions', async () => {
  const pts = points(false);
  // 1) Pointer over the bar chart, through PriceChart's hit-testing helper.
  const [bar] = capture(
    <PriceChart
      points={pts}
      activeIndex={-1}
      consumerBestTimes={consumersFor(pts)}
    />,
  );
  const { chart } = draw(bar, W, BAR_H);
  const left = chart.convertToPixel({ xAxisIndex: 0 }, 0) as number;
  const right = chart.convertToPixel(
    { xAxisIndex: 0 },
    pts.length - 1,
  ) as number;
  const x = left + (right - left) * 0.42;
  const barIndex = barIndexAtPixel(chart, x, pts.length);
  console.log(
    'after: bar chart pointer at x=%d -> index %d (%s)',
    Math.round(x),
    barIndex,
    pts[barIndex]?.label,
  );
  expect(barIndex).toBeGreaterThan(0);
  expect(barIndexAtPixel(chart, -50, pts.length)).toBe(-1);
  expect(barIndexAtPixel(chart, W + 50, pts.length)).toBe(-1);
  await renderState(
    '3-hover-bar-chart',
    `Hover bar chart @ ${pts[barIndex].label} tomorrow`,
    { predictions: false, displayIndex: barIndex },
  );

  // 2) Pointer over tomorrow-PM clock at "7 o'clock", through RateClock's hit-testing helper.
  const a = (7.2 / 12) * 2 * Math.PI - Math.PI / 2;
  const { slot, hours } = clockSlotAt(
    150 + 100 * Math.cos(a),
    150 + 100 * Math.sin(a),
    CLOCK,
    CLOCK,
  );
  const start = new Date(tomorrow);
  start.setHours(12, 0, 0, 0);
  const global = pts.findIndex(
    (p) => p.startMs === start.getTime() + slot * MS.PER_HALF_HOUR,
  );
  console.log(
    'after: clock pointer -> slot %d (%sh) -> global %d (%s)',
    slot,
    hours.toFixed(2),
    global,
    pts[global]?.label,
  );
  await renderState(
    '4-hover-clock',
    `Hover tomorrow PM clock @ ${pts[global].label}`,
    { predictions: false, displayIndex: global, pointer: { clock: 3, hours } },
  );
});

test('after: predictions toggled on', async () => {
  const pts = points(true);
  const i = pts.findIndex((p) => !p.isConfirmed) + 6;
  await renderState(
    '5-predictions-hover',
    `Predictions on, hover predicted ${pts[i].label}`,
    { predictions: true, displayIndex: i },
  );
});

test('after: merged option updates render identically to fresh renders', async () => {
  const { default: StartTimeHintChart } =
    await import('../../src/components/StartTimeHintChart');
  const plain = points(false),
    withPred = points(true);
  const c1 = consumersFor(plain),
    c2 = consumersFor(withPred);
  const opt = (el: ReactElement) => capture(el)[0].option;
  const hint = (mode: 'starts-in' | 'ends-in', hours: number) => (
    <StartTimeHintChart
      choice={{
        timer: { mode, duration: { hours } },
        setTime: new Date(NOW + 3_600_000),
      }}
      consumer={{ name: 'x', duration: { hours: 2 }, timers: [] }}
      periodPoints={plain.slice(4, 8)}
      showPeriod={mode === 'starts-in'}
    />
  );
  const clockAt = (
    pts: typeof plain,
    i: number,
    hand: number | null,
    best = c1,
  ) => {
    injectedPointerHours = hand;
    try {
      return opt(
        <RateClock
          dateKey={tomorrow}
          startHourOfDay={0}
          points={pts}
          displayIndex={i}
          consumerBestTimes={best}
        />,
      );
    } finally {
      injectedPointerHours = null;
    }
  };
  const cases: [string, any, any, number, number][] = [
    [
      'bar: hover -> none',
      opt(
        <PriceChart points={plain} activeIndex={25} consumerBestTimes={c1} />,
      ),
      opt(
        <PriceChart points={plain} activeIndex={-1} consumerBestTimes={c1} />,
      ),
      W,
      BAR_H,
    ],
    [
      'bar: plain -> predictions',
      opt(<PriceChart points={plain} activeIndex={3} consumerBestTimes={c1} />),
      opt(
        <PriceChart
          points={withPred}
          activeIndex={70}
          consumerBestTimes={c2}
        />,
      ),
      W,
      BAR_H,
    ],
    [
      'bar: predictions -> plain',
      opt(
        <PriceChart
          points={withPred}
          activeIndex={70}
          consumerBestTimes={c2}
        />,
      ),
      opt(<PriceChart points={plain} activeIndex={-1} />),
      W,
      BAR_H,
    ],
    [
      'vertical: predictions -> plain',
      opt(<VerticalPriceChart points={withPred} consumerBestTimes={c2} />),
      opt(<VerticalPriceChart points={plain} />),
      W,
      3000,
    ],
    [
      'clock: hand+hover -> idle',
      clockAt(plain, 30, 4.2),
      clockAt(plain, -1, null, []),
      CLOCK,
      CLOCK,
    ],
    [
      'clock: plain -> predictions',
      clockAt(plain, 30, null),
      clockAt(withPred, 40, 2.1, c2),
      CLOCK,
      CLOCK,
    ],
    [
      'hint: starts-in+period -> ends-in',
      opt(hint('starts-in', 3)),
      opt(hint('ends-in', 5)),
      400,
      148,
    ],
  ];
  // Ignore generated ids/class indices; compare the drawn elements.
  const norm = (s: string) =>
    s.replace(/zr\d+-/g, 'zr-').replace(/zr-cls-\d+/g, 'zr-cls');
  for (const [name, a, b, w, h] of cases) {
    const fresh = init(null, null, {
      renderer: 'svg',
      ssr: true,
      width: w,
      height: h,
    });
    fresh.setOption(b);
    const merged = init(null, null, {
      renderer: 'svg',
      ssr: true,
      width: w,
      height: h,
    });
    merged.setOption(a);
    merged.setOption(b); // same call as EChart.tsx (merge)
    expect(norm(merged.renderToSVGString()), name).toBe(
      norm(fresh.renderToSVGString()),
    );
  }
});
