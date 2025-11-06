import type { PricePoint } from '../lib/types';
import { incVatValue } from '../lib/priceUtils';
import { rateToColor } from '../lib/colors';
import { formatTimeLocal } from '../lib/dateUtils';
import type { ChartData, ChartOptions, Chart, TooltipItem } from 'chart.js';

import { PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  PolarAreaController,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  PolarAreaController,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
);

type Props = {
  dateKey: string;
  startHour: number;
  title: string;
  segments: PricePoint[];
  nowMs: number;
};

export default function RateClock({
  dateKey,
  startHour,
  title,
  segments,
  nowMs,
}: Props) {
  const segs = segments
    .slice()
    .sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
  const vals = segs.map((s) => incVatValue(s));
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;

  // compute midnight for the dateKey in Europe/London
  const dayStart = new Date(
    new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
  );
  if (dateKey !== dayStart.toLocaleDateString('en-GB')) {
    const [dd, mm, yyyy] = dateKey.split('/');
    dayStart.setFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  // Build 24 half-hour labels and data points
  const labels: string[] = [];
  const dataValues: number[] = [];
  const backgroundColor: string[] = [];
  const borderColor: string[] = [];
  const borderWidth: number[] = [];

  const nowDateKey = new Date(nowMs).toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
  });

  for (let i = 0; i < 24; i++) {
    const start = new Date(
      dayStart.getTime() + (startHour * 60 + i * 30) * 60 * 1000,
    );
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const match = segs.find((s) => s.valid_from.getTime() === start.getTime());
    const value = match ? incVatValue(match) : NaN;

    labels.push(`${formatTimeLocal(start)}–${formatTimeLocal(end)}`);
    dataValues.push(isNaN(value) ? 0 : value);

    let color: string;
    if (isNaN(value)) {
      color = 'rgba(30,30,30,0.6)';
    } else {
      const base = rateToColor(value, min, max);
      if (end.getTime() <= nowMs) {
        color = base.replace('rgb(', 'rgba(').replace(')', ',0.28)');
      } else {
        color = base;
      }
    }
    backgroundColor.push(color);

    if (nowMs >= start.getTime() && nowMs < end.getTime()) {
      borderColor.push('#ffd54f');
      borderWidth.push(4);
    } else {
      borderColor.push('rgba(0,0,0,0.12)');
      borderWidth.push(1);
    }
  }

  const data: ChartData<'polarArea', number[], string> = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor,
        borderColor,
        borderWidth,
      },
    ],
  };

  // small plugin to draw the 'now' marker when the date matches
  const nowMarkerPlugin = {
    id: 'nowMarkerPlugin',
    afterDraw: (chart: Chart) => {
      if (nowDateKey !== dateKey) return;

      const localMidnight = new Date(
        new Date().toLocaleString('en-GB', {
          timeZone: 'Europe/London',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      );
      const minutes = Math.floor((nowMs - localMidnight.getTime()) / 60000);
      const minutesIntoWindow = minutes - startHour * 60;
      if (minutesIntoWindow < 0 || minutesIntoWindow >= 12 * 60) return;

      const frac = minutesIntoWindow / (12 * 60);
      const angle = frac * Math.PI * 2 - Math.PI / 2; // match svg offset

      const ctx = chart.ctx;
      const cx = chart.width / 2;
      const cy = chart.height / 2;
      const r = Math.min(chart.width, chart.height) / 2 - 20;

      const ax = cx + r * Math.cos(angle);
      const ay = cy + r * Math.sin(angle);

      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#b37a00';
      ctx.stroke();
      ctx.restore();
    },
  };

  // plugin to draw hour/half-hour ticks and labels responsively
  const hourLabelsPlugin = {
    id: 'hourLabelsPlugin',
    afterDraw: (chart: Chart) => {
      const ctx = chart.ctx;
      const width = chart.width;
      const height = chart.height;
      const cx = width / 2;
      const cy = height / 2;
      // Use Chart.js radial scale to align with the out-most grid ring
      const scale = chart.scales && (chart.scales.r || chart.scales['r']);
      if (!(scale instanceof RadialLinearScale)) return;

      const rOuter =
        scale && scale.drawingArea
          ? scale.drawingArea
          : Math.min(width, height) / 2 - 12;
      const rTickOuter = rOuter;
      const rTickHourInner = rOuter - Math.max(12, rOuter * 0.12);
      const rTickHalfInner = rOuter - Math.max(8, rOuter * 0.08);
      const rLabel = rOuter - Math.max(24, rOuter * 0.22);

      ctx.save();

      // Draw hour ticks (thicker)
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = Math.max(2, rOuter * 0.018);
      ctx.globalAlpha = 0.9;
      for (let h = 0; h < 12; h++) {
        const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
        const ix = cx + rTickHourInner * Math.cos(angle);
        const iy = cy + rTickHourInner * Math.sin(angle);
        const ox = cx + rTickOuter * Math.cos(angle);
        const oy = cy + rTickOuter * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }

      // Draw half-hour ticks (thinner)
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = Math.max(1, rOuter * 0.009);
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const ix = cx + rTickHalfInner * Math.cos(angle);
        const iy = cy + rTickHalfInner * Math.sin(angle);
        const ox = cx + rTickOuter * Math.cos(angle);
        const oy = cy + rTickOuter * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Draw hour labels with shadow for clarity
      ctx.fillStyle = '#eaf6ff';
      const fontSize = Math.max(18, Math.round(rOuter * 0.16));
      ctx.font = `700 ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = fontSize * 0.18;
      for (let h = 0; h < 12; h++) {
        const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + rLabel * Math.cos(angle);
        const ly = cy + rLabel * Math.sin(angle);
        const raw = (startHour + h) % 12;
        const labelVal = raw === 0 ? 12 : raw;
        ctx.fillText(String(labelVal), lx, ly);
      }

      // center AM/PM label
      ctx.shadowBlur = 0;
      ctx.font = `700 ${fontSize}px sans-serif`;
      const centerAmPm = startHour === 0 ? 'AM' : 'PM';
      ctx.fillText(centerAmPm, cx, cy);
      ctx.restore();
    },
  };

  const options: ChartOptions<'polarArea'> = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items: TooltipItem<'polarArea'>[]) => items[0]?.label ?? '',
          label: (ctx: TooltipItem<'polarArea'>) => {
            const v = ctx.parsed.r;
            return v == null ? 'No data' : `${v} p/kWh (inc VAT)`;
          },
        },
        bodyFont: { size: 16 },
        titleFont: { size: 14 },
      },
    },
    scales: {
      r: {
        ticks: { display: false },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    maxWidth: 260,
    maxHeight: 260,
    position: 'relative',
    aspectRatio: '1/1',
    minWidth: 120,
    minHeight: 120,
  };

  return (
    <div className="rate-clock" key={`${dateKey}-${startHour}`}>
      <div className="clock-title">{title}</div>
      <div style={containerStyle}>
        <PolarArea
          data={data}
          options={options}
          plugins={[nowMarkerPlugin, hourLabelsPlugin]}
        />
      </div>
    </div>
  );
}
