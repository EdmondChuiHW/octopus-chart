import type { Plugin, Chart } from 'chart.js';
import { RadialLinearScale } from 'chart.js';
import { COLORS } from '../../lib/colors';
import { CLOCK_LAYOUT } from '../../lib/constants';

// Factory to build a polar-area plugin that draws hour/half-hour ticks and labels
export function hourLabelsPluginFactory(
  startHour: number,
): Plugin<'polarArea'> {
  const plugin: Plugin<'polarArea'> = {
    id: 'hourLabelsPlugin',
    afterDraw: (chart: Chart) => {
      const ctx = chart.ctx;
      const width = chart.width;
      const height = chart.height;
      const cx = width / 2;
      const cy = height / 2;
      const scale = chart.scales.r;
      if (!(scale instanceof RadialLinearScale)) return;

      const rOuter = scale.drawingArea;

      // TODO read from resolved scale grid lineWidth option
      const rTickOuter = rOuter - CLOCK_LAYOUT.R_TICK_OUTER_DELTA;
      const rTickHourInner =
        rOuter -
        Math.max(
          CLOCK_LAYOUT.R_TICK_HOUR_MIN,
          rOuter * CLOCK_LAYOUT.R_TICK_HOUR_RATIO,
        );
      const rTickHalfInner =
        rOuter -
        Math.max(
          CLOCK_LAYOUT.R_TICK_HALF_MIN,
          rOuter * CLOCK_LAYOUT.R_TICK_HALF_RATIO,
        );
      const rLabel =
        rOuter -
        Math.max(CLOCK_LAYOUT.R_LABEL_MIN, rOuter * CLOCK_LAYOUT.R_LABEL_RATIO);

      ctx.save();

      // Determine whether the containing .rate-clock has the 'am' (light)
      // theme so we can adapt canvas-drawn colors (ticks, labels) to remain
      // visible on a light background.
      let hourTickColor: string = COLORS.HOUR_TICK;
      let halfTickColor: string = COLORS.HALF_TICK;
      const canvas = chart.canvas;
      const parent = canvas.closest('.rate-clock');
      if (parent?.classList.contains('am')) {
        // Make ticks significantly darker for high contrast on light
        // backgrounds per user request.
        hourTickColor = 'rgba(2,14,18,0.56)';
        halfTickColor = 'rgba(2,14,18,0.4)';
      }

      // Draw hour ticks (thicker)
      ctx.strokeStyle = hourTickColor;
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
      ctx.strokeStyle = halfTickColor;
      ctx.lineWidth = Math.max(1, rOuter * 0.02);
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 24; i++) {
        if (i % 2 === 0) continue; // skip hours

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
      // Choose color/shadow depending on whether the containing .rate-clock
      // element is using the light ("am") theme. The hour labels are drawn
      // on the chart canvas, so we detect the parent element and adapt.
      let hourLabelColor: string = COLORS.HOUR_LABEL;
      let shadowColor = 'rgba(0,0,0,0.45)';
      let shadowBlurFactor = 0.18;
      if (parent?.classList.contains('am')) {
        // Use very dark label color and stronger shadow for maximum
        // legibility on light backgrounds.
        hourLabelColor = '#000b0b';
        shadowColor = 'rgba(2,14,18,0.36)';
        shadowBlurFactor = 0.14;
      }

      ctx.fillStyle = hourLabelColor;
      const fontSize = Math.max(
        18,
        Math.round(rOuter * CLOCK_LAYOUT.HOUR_FONT_RATIO),
      );
      ctx.font = `700 ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = fontSize * shadowBlurFactor;
      for (let h = 0; h < 12; h++) {
        const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + rLabel * Math.cos(angle);
        const ly = cy + rLabel * Math.sin(angle);
        const raw = (startHour + h) % 12;
        const labelVal = raw === 0 ? 12 : raw;
        ctx.fillText(String(labelVal), lx, ly);
      }

      ctx.restore();
    },
  };
  return plugin;
}
