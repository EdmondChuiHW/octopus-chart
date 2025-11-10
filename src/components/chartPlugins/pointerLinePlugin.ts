import type { Plugin, Chart } from 'chart.js';
import { RadialLinearScale } from 'chart.js';
import { COLORS, CLOCK_LAYOUT } from '../../lib/constants';

// Plugin that draws a radial line on a polar clock which follows the user's pointer.
// Store per-chart state in a WeakMap so we don't modify the Chart instance.

type PointerState = {
  angle: number | null;
  handlers: {
    move: (e: PointerEvent) => void;
    leave: (e: PointerEvent) => void;
  };
};

export function pointerLinePluginFactory(): Plugin<'polarArea'> {
  const pointerState = new WeakMap<Chart, PointerState>();
  const plugin: Plugin<'polarArea'> = {
    id: 'pointerLinePlugin',

    // Attach pointer event listeners so the line follows the user's pointer over the canvas.
    afterInit: (chart: Chart) => {
      // If handlers already attached, don't attach again
      if (pointerState.has(chart)) return;

      const canvas = chart.canvas;

      const onMove = (e: PointerEvent) => {
        const state = pointerState.get(chart);
        if (!state) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        // angle matching chart drawing orientation (0 at +x, -PI/2 = top)
        const angle = Math.atan2(dy, dx);
        state.angle = angle;
        chart.update();
      };

      const onLeave = () => {
        const state = pointerState.get(chart);
        if (!state) return;

        state.angle = null;
        chart.update();
      };

      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerout', onLeave);

      pointerState.set(chart, {
        angle: null,
        handlers: { move: onMove, leave: onLeave },
      });
    },

    // Remove pointer listeners when the chart is destroyed
    beforeDestroy: (chart: Chart) => {
      const state = pointerState.get(chart);
      if (!state) return;

      chart.canvas.removeEventListener('pointermove', state.handlers.move);
      chart.canvas.removeEventListener('pointerout', state.handlers.leave);
      pointerState.delete(chart);
    },

    afterDraw: (chart: Chart) => {
      const state = pointerState.get(chart);
      const angle = state?.angle;
      if (angle == null) return;

      const ctx = chart.ctx;
      const width = chart.width;
      const height = chart.height;
      const cx = width / 2;
      const cy = height / 2;

      const scale = chart.scales.r;
      if (!(scale instanceof RadialLinearScale)) return;

      const rOuter = scale.drawingArea;

      // length of the minute-style hand (stop a little before the outer ring)
      const rHand = rOuter - Math.max(6, CLOCK_LAYOUT.R_TICK_OUTER_DELTA + 4);

      const ex = cx + rHand * Math.cos(angle);
      const ey = cy + rHand * Math.sin(angle);

      ctx.save();

      // Draw a soft shadowed line for contrast
      ctx.strokeStyle = COLORS.PRIMARY_BLUE;
      ctx.lineWidth = Math.max(2, Math.round(rOuter * 0.02));
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = ctx.lineWidth * 0.9;
      ctx.globalAlpha = 0.95;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Draw a small circular tip for the hand
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      const tipRadius = Math.max(4, Math.round(rOuter * 0.02));
      ctx.beginPath();
      ctx.arc(ex, ey, tipRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  };
  return plugin;
}
