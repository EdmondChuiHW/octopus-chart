import type { Chart, Plugin, ChartDataset } from "chart.js";

export function axisTickPluginFactory(nowMs = Date.now()): Plugin<"bar"> {
  const plugin: Plugin<"bar"> = {
    id: "axisTickPlugin",
    afterDraw: (chart: Chart) => {
      const xScale = chart.scales.x;
      if (!xScale) return;

      const ctx = chart.ctx;
      ctx.save();
      const chartBottom = chart.chartArea.bottom;

      type ExtDs = ChartDataset<"bar", number[]> & {
        startMs: number[];
        endMs: number[];
      };
      const ds = (chart.data.datasets as ExtDs[])[0];
      const starts: number[] = ds.startMs || [];
      const ends: number[] = ds.endMs || [];
      const now = nowMs;

      for (let i = 0; i < xScale.ticks.length; i++) {
        const tick = xScale.ticks[i];
        const x = xScale.getPixelForTick(i);
        const isMajor = !!tick.label;
        const s = starts[i];
        const e = ends[i];
        const isActive = now >= s && now < e;
        const len = isMajor ? 8 : 4;
        ctx.beginPath();
        ctx.strokeStyle = isActive ? "#ffd54f" : "rgba(234,246,255,0.9)";
        ctx.lineWidth = isActive ? 2 : isMajor ? 1.25 : 1;
        ctx.moveTo(x, chartBottom + 0.5);
        ctx.lineTo(x, chartBottom + len + 0.5);
        ctx.stroke();
      }

      ctx.restore();
    },
  };
  return plugin;
}
