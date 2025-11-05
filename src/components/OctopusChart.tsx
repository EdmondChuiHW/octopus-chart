import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  Legend,
} from "chart.js";
import type { ChartOptions, Chart } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Title,
  Legend
);

// Zod-backed PricePoint schema: accepts API timestamp strings and
// preprocesses them into JS Date objects so the rest of the code can
// rely on Date instances without re-parsing.
export const PricePointSchema = z.object({
  value_exc_vat: z.number(),
  value_inc_vat: z.number().optional(),
  valid_from: z.iso.datetime().transform((d) => new Date(d)),
  valid_to: z.iso.datetime().transform((d) => new Date(d)),
});

export type PricePoint = z.infer<typeof PricePointSchema>;

const DEFAULT_PRODUCT = "AGILE-24-10-01";
const DEFAULT_TARIFF = "E-1R-AGILE-24-10-01-C"; // London (default). Can be changed in UI.

function isoOffsetHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function formatTimeLocal(date: Date | string) {
  try {
    const d = date instanceof Date ? date : new Date(date);
    // Use 12-hour clock with AM/PM for readability in the UI
    return d.toLocaleTimeString("en-US", {
      timeZone: "Europe/London",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(date);
  }
}

export default function OctopusChart() {
  const [product, setProduct] = useState(DEFAULT_PRODUCT);
  const [tariff, setTariff] = useState(DEFAULT_TARIFF);
  // useQuery will manage fetching/loading/error and provide the points
  const {
    data: points = [] as PricePoint[],
    isLoading,
    error,
    refetch,
  } = useQuery<PricePoint[], Error, PricePoint[], [string, string, string]>({
    queryKey: ["prices", product, tariff],
    // provide a typed QueryFunctionContext so `queryKey` elements are typed
    queryFn: async (
      ctx: QueryFunctionContext<[string, string, string]>
    ): Promise<PricePoint[]> => {
      const [, p, t] = ctx.queryKey;
      const period_from = isoOffsetHours(-12);
      const period_to = isoOffsetHours(36);
      const url = `https://api.octopus.energy/v1/products/${encodeURIComponent(
        p
      )}/electricity-tariffs/${encodeURIComponent(
        t
      )}/standard-unit-rates/?period_from=${encodeURIComponent(
        period_from
      )}&period_to=${encodeURIComponent(period_to)}&page_size=1500`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API returned ${res.status} ${res.statusText}`);
      }
      const json = await res.json();

      // validate the API response and coerce timestamp strings into Dates
      const ResponseSchema = z.object({
        results: z.array(PricePointSchema).optional(),
      });

      const parsed = ResponseSchema.safeParse(json);
      if (!parsed.success) {
        // include the validation errors for easier debugging
        throw new Error(
          `API response validation failed: ${parsed.error.message}`
        );
      }

      const results: PricePoint[] = parsed.data.results || [];
      results.sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
      return results;
    },
    // avoid refetching on window focus by default
    refetchOnWindowFocus: false,
  });
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Note: initial load and subsequent loads are handled by useQuery.

  // keep a live clock so the active period updates while the app is open
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000); // update every 30s
    return () => clearInterval(id);
  }, []);

  const labels = useMemo(
    () =>
      points.map(
        (p) => `${formatTimeLocal(p.valid_from)}–${formatTimeLocal(p.valid_to)}`
      ),
    [points]
  );
  const dataValues = useMemo(
    () =>
      points.map((p) => {
        // prefer server-provided inc VAT where available, otherwise compute from excl VAT
        const incRaw = p.value_inc_vat ?? p.value_exc_vat * 1.05;
        return Math.round(incRaw * 100) / 100;
      }),
    [points]
  );

  // color bars: active (highlight), future (normal), past (muted)
  const backgroundColors = dataValues.map((_, i) => {
    const p = points[i];
    if (!p) return "rgba(0,120,212,0.6)";
    const start = p.valid_from.getTime();
    const end = p.valid_to.getTime();
    if (nowMs >= start && nowMs < end) return "rgba(255,205,86,0.95)";
    if (nowMs >= end) return "rgba(0,120,212,0.28)";
    return "rgba(0,120,212,0.95)";
  });

  // expose start/end ms arrays so plugins can read the exact timestamps
  const startMs = points.map((p) => p.valid_from.getTime());
  const endMs = points.map((p) => p.valid_to.getTime());

  const data = {
    labels,
    datasets: [
      {
        label: "p/kWh (inc VAT)",
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        // attach custom props; TS doesn't know about these but the plugin uses them
        startMs,
        endMs,
      },
    ],
  };

  // --- Clock visualization helpers ---
  const getLocalDateKey = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
    });
  };

  const todayKey = new Date(nowMs).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
  });
  const tomorrowKey = new Date(nowMs + 24 * 3600 * 1000).toLocaleDateString(
    "en-GB",
    { timeZone: "Europe/London" }
  );

  const dayMap = useMemo(() => {
    const map = new Map<string, PricePoint[]>();
    for (const p of points) {
      const k = getLocalDateKey(p.valid_from);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return map;
  }, [points]);

  // get 48 segments for a day (may be less if missing); ensures sorted by start time
  const segmentsForDay = (key: string) => {
    const arr = dayMap.get(key) || [];
    return arr
      .slice()
      .sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
  };

  // color scale mapping rate -> color (green=low, red=high)
  function rateToColor(value: number, min: number, max: number) {
    if (isNaN(value)) return "#222";
    const t = max > min ? (value - min) / (max - min) : 0.5;
    // interpolate from #2ecc71 (green) to #e74c3c (red)
    const r1 = 46,
      g1 = 204,
      b1 = 113;
    const r2 = 231,
      g2 = 76,
      b2 = 60;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  const [hoverInfo, setHoverInfo] = useState<{
    label: string;
    value: number | null;
    x?: number;
    y?: number;
  } | null>(null);

  function buildWedgePath(
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    startAngle: number,
    endAngle: number
  ) {
    // angles in radians, 0 at -90deg (12 o'clock)
    const sa = startAngle - Math.PI / 2;
    const ea = endAngle - Math.PI / 2;
    const x1 = cx + rOuter * Math.cos(sa);
    const y1 = cy + rOuter * Math.sin(sa);
    const x2 = cx + rOuter * Math.cos(ea);
    const y2 = cy + rOuter * Math.sin(ea);
    const x3 = cx + rInner * Math.cos(ea);
    const y3 = cy + rInner * Math.sin(ea);
    const x4 = cx + rInner * Math.cos(sa);
    const y4 = cy + rInner * Math.sin(sa);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  // render a 12-hour half-day clock (24 half-hour wedges) starting at startHour (0 or 12)
  function renderHalfDayClock(key: string, startHour: number, title: string) {
    const segs = segmentsForDay(key);
    // build inc-vat values and compute min/max
    const vals = segs.map(
      (s) => s.value_inc_vat ?? Math.round(s.value_exc_vat * 1.05 * 100) / 100
    );
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;

    // shift the center out a little and make the SVG larger so labels
    // can be placed further from the ring without clipping
    const cx = 130;
    const cy = 130;
    // slightly smaller clock so there's more breathing room for labels
    const rOuter = 96;
    const rInner = 40;

    // find midnight of the key in Europe/London then iterate half-day slots
    const dayStart = new Date(
      new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );
    if (key !== dayStart.toLocaleDateString("en-GB")) {
      const [dd, mm, yyyy] = key.split("/");
      dayStart.setFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
    }

    const wedges: ReactNode[] = [];
    for (let i = 0; i < 24; i++) {
      const start = new Date(
        dayStart.getTime() + (startHour * 60 + i * 30) * 60 * 1000
      );
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      // find matching segment by valid_from
      const match = segs.find(
        (s) => s.valid_from.getTime() === start.getTime()
      );
      const value = match
        ? match.value_inc_vat ??
          Math.round(match.value_exc_vat * 1.05 * 100) / 100
        : NaN;
      const angleStart = (i / 24) * Math.PI * 2;
      const angleEnd = ((i + 1) / 24) * Math.PI * 2;
      let color;
      let strokeColor = "rgba(0,0,0,0.12)";
      let strokeWidth = 1;
      if (isNaN(value)) {
        color = "rgba(30,30,30,0.6)";
      } else {
        const base = rateToColor(value, min, max); // returns 'rgb(r,g,b)'
        // if this period is fully in the past, render muted (lower alpha)
        if (end.getTime() <= nowMs) {
          // convert rgb(...) to rgba(...,0.28)
          color = base.replace("rgb(", "rgba(").replace(")", ",0.28)");
        } else {
          color = base;
        }
      }
      // if this is the active current period, emphasize it with an outline
      if (nowMs >= start.getTime() && nowMs < end.getTime()) {
        strokeColor = "#ffd54f";
        strokeWidth = 4;
      }

      wedges.push(
        <path
          key={`${startHour}-${i}`}
          d={buildWedgePath(cx, cy, rOuter, rInner, angleStart, angleEnd)}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          onMouseEnter={(e) => {
            setHoverInfo({
              label: `${formatTimeLocal(start)}–${formatTimeLocal(end)}`,
              value: isNaN(value) ? null : value,
              x: e.clientX,
              y: e.clientY,
            });
          }}
          onMouseLeave={() => setHoverInfo(null)}
        />
      );
    }

    // hour labels (12 labels around the clock) - respect half-day startHour
    const hourLabels: ReactNode[] = [];
    for (let h = 0; h < 12; h++) {
      const angle = (h / 12) * Math.PI * 2;
      // place hour labels inside the outer ring (closer to the center)
      const lx = cx + (rOuter - 24) * Math.cos(angle - Math.PI / 2);
      const ly = cy + (rOuter - 24) * Math.sin(angle - Math.PI / 2);
      const raw = (startHour + h) % 12;
      const labelVal = raw === 0 ? 12 : raw;
      hourLabels.push(
        <text
          key={`hour-${startHour}-${h}`}
          x={lx}
          y={ly}
          fill="#eaf6ff"
          fontSize={18}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {labelVal}
        </text>
      );
    }

    // ticks: longer ticks at each hour and shorter ticks at each half-hour
    const hourTicks: ReactNode[] = [];
    for (let h = 0; h < 12; h++) {
      const angle = (h / 12) * Math.PI * 2;
      // hour ticks drawn inside the ring (longer inward ticks)
      const ix = cx + (rOuter - 12) * Math.cos(angle - Math.PI / 2);
      const iy = cy + (rOuter - 12) * Math.sin(angle - Math.PI / 2);
      const ox = cx + (rOuter - 2) * Math.cos(angle - Math.PI / 2);
      const oy = cy + (rOuter - 2) * Math.sin(angle - Math.PI / 2);
      hourTicks.push(
        <line
          key={`tick-hour-${startHour}-${h}`}
          x1={ix}
          y1={iy}
          x2={ox}
          y2={oy}
          stroke="#eaf6ff"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.9}
        />
      );
    }

    // smaller half-hour ticks (shorter and lighter)
    const halfHourTicks: ReactNode[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      // half-hour ticks shorter, also drawn inside the ring
      const ix = cx + (rOuter - 8) * Math.cos(angle - Math.PI / 2);
      const iy = cy + (rOuter - 8) * Math.sin(angle - Math.PI / 2);
      const ox = cx + (rOuter - 2) * Math.cos(angle - Math.PI / 2);
      const oy = cy + (rOuter - 2) * Math.sin(angle - Math.PI / 2);
      halfHourTicks.push(
        <line
          key={`tick-half-${startHour}-${i}`}
          x1={ix}
          y1={iy}
          x2={ox}
          y2={oy}
          stroke="#eaf6ff"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.6}
        />
      );
    }

    // compute active marker angle for nowMs if within this half-day
    const nowDateKey = new Date(nowMs).toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
    });
    let nowMarker: ReactNode | null = null;
    if (nowDateKey === key) {
      const localMidnight = new Date(
        new Date().toLocaleString("en-GB", {
          timeZone: "Europe/London",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      );
      const minutes = Math.floor((nowMs - localMidnight.getTime()) / 60000);
      const minutesIntoWindow = minutes - startHour * 60;
      if (minutesIntoWindow >= 0 && minutesIntoWindow < 12 * 60) {
        const frac = minutesIntoWindow / (12 * 60);
        const angle = frac * Math.PI * 2;
        // place the now marker just inside the outer edge
        const ax = cx + (rOuter - 6) * Math.cos(angle - Math.PI / 2);
        const ay = cy + (rOuter - 6) * Math.sin(angle - Math.PI / 2);
        nowMarker = (
          <circle
            cx={ax}
            cy={ay}
            r={6}
            fill="#ffd54f"
            stroke="#b37a00"
            strokeWidth={2}
          />
        );
      }
    }

    // center AM/PM label for this half-day
    const centerAmPm = startHour === 0 ? "AM" : "PM";

    return (
      <div className="rate-clock" key={`${key}-${startHour}`}>
        <div className="clock-title">{title}</div>
        <svg width={260} height={260} viewBox={`0 0 260 260`} aria-hidden>
          <g transform={`translate(0,0)`}>
            {wedges}
            <g className="hour-ticks">{hourTicks}</g>
            <g className="half-hour-ticks">{halfHourTicks}</g>
            <g className="hour-labels">{hourLabels}</g>
            {/* centered am/pm label */}
            <text
              x={cx}
              y={cy}
              fill="#eaf6ff"
              fontSize={18}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {centerAmPm}
            </text>
          </g>
          {nowMarker}
        </svg>
      </div>
    );
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => {
            // items[0].label is the label we set (time range)
            return items[0]?.label || "";
          },
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v === null || v === undefined) return "No data";
            return `${v} p/kWh (inc VAT)`;
          },
        },
        bodyFont: { size: 16 },
        titleFont: { size: 14 },
      },
      title: { display: false },
    },
    scales: {
      x: {
        // show ticks for every half-hour but only label full hours ("3pm", "2am")
        // ensure every tick is rendered (we return empty string for half-hours)
        ticks: {
          // scriptable backdrop color: highlight the active tick using the
          // yellow pill color. Return undefined for non-active ticks so Chart.js
          // doesn't draw a backdrop.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backdropColor: (ctx: any) => {
            try {
              const idx =
                typeof ctx.index === "number" ? ctx.index : Number(ctx.index);
              const chart = ctx.chart as Chart;
              const ds = chart.data.datasets?.[0] as unknown as {
                startMs?: number[];
                endMs?: number[];
              };
              const start = ds?.startMs?.[idx];
              const end = ds?.endMs?.[idx];
              if (typeof start !== "number" || typeof end !== "number")
                return undefined;
              const now = Date.now();
              const isActive = now >= start && now < end;
              return isActive ? "#ffd54f" : undefined;
            } catch {
              return undefined;
            }
          },
          // only show the backdrop for the active tick
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          showLabelBackdrop: (ctx: any) => {
            try {
              const idx =
                typeof ctx.index === "number" ? ctx.index : Number(ctx.index);
              const chart = ctx.chart as Chart;
              const ds = chart.data.datasets?.[0] as unknown as {
                startMs?: number[];
                endMs?: number[];
              };
              const start = ds?.startMs?.[idx];
              const end = ds?.endMs?.[idx];
              if (typeof start !== "number" || typeof end !== "number")
                return false;
              const now = Date.now();
              return now >= start && now < end;
            } catch {
              return false;
            }
          },
          // scriptable color/font so Chart.js paints the active label differently
          color: (ctx) => {
            const idx =
              typeof ctx.index === "number" ? ctx.index : Number(ctx.index);
            try {
              const chart = ctx.chart as Chart;
              const ds = chart.data.datasets?.[0] as unknown as {
                startMs?: number[];
                endMs?: number[];
              };
              const start = ds?.startMs?.[idx];
              const end = ds?.endMs?.[idx];
              if (typeof start !== "number" || typeof end !== "number")
                return "#ffffff";
              const now = Date.now();
              const isActive = now >= start && now < end;
              // Use black text on the highlighted backdrop for legibility
              return isActive ? "#000000" : "#ffffff";
            } catch {
              return "#ffffff";
            }
          },
          font: {
            size: 13,
            // Chart.js expects weight to be a number or keyword; return numeric weight
            weight: (ctx) => {
              const idx =
                typeof ctx.index === "number" ? ctx.index : Number(ctx.index);
              try {
                const chart = ctx.chart as Chart;
                const ds = chart.data.datasets?.[0] as unknown as {
                  startMs?: number[];
                  endMs?: number[];
                };
                const start = ds?.startMs?.[idx];
                const end = ds?.endMs?.[idx];
                if (typeof start !== "number" || typeof end !== "number")
                  return 400;
                const now = Date.now();
                const isActive = now >= start && now < end;
                return isActive ? 700 : 400;
              } catch {
                return 400;
              }
            },
          },
          autoSkip: false,
          align: "center",
          callback: (_value, index) => {
            // index is number | string depending on axis type; prefer numeric index
            const idx = typeof index === "number" ? index : Number(index);
            const p = points[idx];
            if (!p) return "";
            // determine the local start time components for this segment
            const startDate = p.valid_from;
            const parts = startDate.toLocaleString("en-GB", {
              timeZone: "Europe/London",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            const [hStr, mStr] = parts.split(":");
            const hour24 = Number(hStr);
            const minute = Number(mStr);
            const start = startDate.getTime();
            const end = p.valid_to.getTime();
            // show label for full hours, or if this segment is the currently active one
            if (minute !== 0 && !(nowMs >= start && nowMs < end)) return "";
            const hour12 = ((hour24 + 11) % 12) + 1;
            const ampm = hour24 >= 12 ? "pm" : "am";
            // if this is an active half-hour, show minute-level label (e.g. "3:30pm")
            if (minute !== 0 && nowMs >= start && nowMs < end) {
              const minuteStr = mStr.padStart(2, "0");
              return `${hour12}:${minuteStr}${ampm}`;
            }
            return `${hour12}${ampm}`;
          },
        },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#ffffff", font: { size: 14 } },
        grid: { color: "rgba(255,255,255,0.08)" },
      },
    },
  };

  // Plugin to draw custom tick marks under the x-axis so half-hour ticks are visible
  // use loose typing for the plugin to avoid importing Chart types here
  const axisTickPlugin = {
    id: "axisTickPlugin",
    afterDraw: (chart: Chart) => {
      const xScale = chart.scales?.x;
      if (!xScale) return;
      const ctx = chart.ctx as CanvasRenderingContext2D;
      ctx.save();
      const chartBottom = chart.chartArea?.bottom ?? 0;

      // read timestamps from the first dataset (the source of truth for Chart.js)
      const ds = chart.data.datasets?.[0] as unknown as {
        startMs?: number[];
        endMs?: number[];
      };
      const starts: number[] = (ds && ds.startMs) || [];
      const ends: number[] = (ds && ds.endMs) || [];
      const now = Date.now();

      // draw ticks (use dataset timestamps to determine active state)
      for (let i = 0; i < xScale.ticks.length; i++) {
        const tick = xScale.ticks[i];
        const idx =
          typeof (tick as { index?: number }).index === "number"
            ? (tick as { index?: number }).index!
            : i;
        const x =
          typeof xScale.getPixelForTick === "function"
            ? xScale.getPixelForTick(idx)
            : xScale.getPixelForValue?.(tick.value) ?? 0;
        const isMajor = !!tick.label;
        const s = starts[idx];
        const e = ends[idx];
        const isActive =
          typeof s === "number" && typeof e === "number" && now >= s && now < e;
        const len = isMajor ? 8 : 4;
        ctx.beginPath();
        ctx.strokeStyle = isActive ? "#ffd54f" : "rgba(234,246,255,0.9)";
        ctx.lineWidth = isActive ? 2 : isMajor ? 1.25 : 1;
        ctx.moveTo(x, chartBottom + 0.5);
        ctx.lineTo(x, chartBottom + len + 0.5);
        ctx.stroke();
      }
      // Note: we no longer draw a custom pill here. The tick backdrop
      // (configured via the ticks.backdropColor and ticks.showLabelBackdrop
      // scriptable options) will render the highlighted label background.

      ctx.restore();
    },
  };

  return (
    <section className="octopus-section">
      <form
        className="controls"
        onSubmit={(e) => {
          e.preventDefault();
          // trigger react-query refetch for the current product/tariff
          void refetch();
        }}
      >
        <label>
          Product
          <input
            aria-label="product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </label>
        <label>
          Tariff code
          <input
            aria-label="tariff"
            value={tariff}
            onChange={(e) => setTariff(e.target.value)}
          />
        </label>
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? "Loading…" : "Load rates"}
        </button>
      </form>

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
            <Bar options={options} data={data} plugins={[axisTickPlugin]} />
          )}
        </div>
      )}

      <div className="clocks-row">
        {renderHalfDayClock(todayKey, 0, "Today AM")}
        {renderHalfDayClock(todayKey, 12, "Today PM")}
        {renderHalfDayClock(tomorrowKey, 0, "Tomorrow AM")}
        {renderHalfDayClock(tomorrowKey, 12, "Tomorrow PM")}
      </div>

      {hoverInfo ? (
        <div
          className="hover-panel"
          style={{
            position: "absolute",
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
              : "No data"}
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
