import type { PricePoint } from "../lib/types";
import { incVatValue } from "../lib/priceUtils";
import { buildWedgePath } from "../lib/svg";
import { rateToColor } from "../lib/colors";
import { formatTimeLocal } from "../lib/dateUtils";
import type { ReactNode } from "react";

type Hover = {
  label: string;
  value: number | null;
  x?: number;
  y?: number;
} | null;

type Props = {
  dateKey: string;
  startHour: number;
  title: string;
  segments: PricePoint[];
  nowMs: number;
  onHover: (h: Hover) => void;
};

export default function RateClock({
  dateKey,
  startHour,
  title,
  segments,
  nowMs,
  onHover,
}: Props) {
  const segs = segments
    .slice()
    .sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
  const vals = segs.map((s) => incVatValue(s));
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;

  const cx = 130;
  const cy = 130;
  const rOuter = 96;
  const rInner = 40;

  // compute midnight for the dateKey in Europe/London
  const dayStart = new Date(
    new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  );
  if (dateKey !== dayStart.toLocaleDateString("en-GB")) {
    const [dd, mm, yyyy] = dateKey.split("/");
    dayStart.setFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  const wedges: ReactNode[] = [];
  for (let i = 0; i < 24; i++) {
    const start = new Date(
      dayStart.getTime() + (startHour * 60 + i * 30) * 60 * 1000
    );
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const match = segs.find((s) => s.valid_from.getTime() === start.getTime());
    const value = match ? incVatValue(match) : NaN;
    const angleStart = (i / 24) * Math.PI * 2;
    const angleEnd = ((i + 1) / 24) * Math.PI * 2;
    let color: string;
    let strokeColor = "rgba(0,0,0,0.12)";
    let strokeWidth = 1;
    if (isNaN(value)) {
      color = "rgba(30,30,30,0.6)";
    } else {
      const base = rateToColor(value, min, max);
      if (end.getTime() <= nowMs) {
        color = base.replace("rgb(", "rgba(").replace(")", ",0.28)");
      } else {
        color = base;
      }
    }
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
          onHover({
            label: `${formatTimeLocal(start)}–${formatTimeLocal(end)}`,
            value: isNaN(value) ? null : value,
            x: e.clientX,
            y: e.clientY,
          });
        }}
        onMouseLeave={() => onHover(null)}
      />
    );
  }

  const hourLabels: ReactNode[] = [];
  for (let h = 0; h < 12; h++) {
    const angle = (h / 12) * Math.PI * 2;
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

  const hourTicks: ReactNode[] = [];
  for (let h = 0; h < 12; h++) {
    const angle = (h / 12) * Math.PI * 2;
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

  const halfHourTicks: ReactNode[] = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
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

  let nowMarker: ReactNode | null = null;
  const nowDateKey = new Date(nowMs).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
  });
  if (nowDateKey === dateKey) {
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

  const centerAmPm = startHour === 0 ? "AM" : "PM";

  return (
    <div className="rate-clock" key={`${dateKey}-${startHour}`}>
      <div className="clock-title">{title}</div>
      <svg width={260} height={260} viewBox={`0 0 260 260`} aria-hidden>
        <g transform={`translate(0,0)`}>
          {wedges}
          <g className="hour-ticks">{hourTicks}</g>
          <g className="half-hour-ticks">{halfHourTicks}</g>
          <g className="hour-labels">{hourLabels}</g>
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
