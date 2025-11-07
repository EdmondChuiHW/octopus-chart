import type { Chart, Plugin, ChartDataset } from 'chart.js';

export function axisTickPluginFactory(nowMs = Date.now()): Plugin<'bar'> {
  const plugin: Plugin<'bar'> = {
    id: 'axisTickPlugin',
    afterDraw: (chart: Chart) => {
      const xScale = chart.scales.x;
      if (!xScale) return;

      const ctx = chart.ctx;
      ctx.save();
      const chartBottom = chart.chartArea.bottom;

      type ExtDs = ChartDataset<
        'bar',
        { x: number; y: number; startMs: number; endMs: number }[]
      >;
      const ds = (chart.data.datasets as ExtDs[])[0];
      const data = ds?.data || [];
      const now = nowMs;

      for (let i = 0; i < xScale.ticks.length; i++) {
        const tick = xScale.ticks[i];
        const x = xScale.getPixelForTick(i);
        const isMajor = !!tick.label;
        const datum = data[i] as
          | { startMs?: number; endMs?: number }
          | undefined;
        const s =
          datum && typeof datum.startMs === 'number'
            ? datum.startMs
            : undefined;
        const e =
          datum && typeof datum.endMs === 'number' ? datum.endMs : undefined;
        const isActive = s != null && e != null && now >= s && now < e;
        const len = isMajor ? 8 : 4;
        ctx.beginPath();
        ctx.strokeStyle = isActive
          ? 'rgba(0,120,212,0.95)'
          : 'rgba(234,246,255,0.9)';
        ctx.lineWidth = isActive ? 4 : isMajor ? 1.25 : 1;
        ctx.moveTo(x, chartBottom + 0.5);
        ctx.lineTo(x, chartBottom + len + 0.5);
        ctx.stroke();
      }

      ctx.restore();
    },
  };
  return plugin;
}
