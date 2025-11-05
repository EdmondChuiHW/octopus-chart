import type { Chart, Plugin } from "chart.js";

export function axisTickPluginFactory(nowMs?: number): Plugin<"bar"> {
  const plugin: Plugin<"bar"> = {
    id: "axisTickPlugin",
    afterDraw: (chart: Chart) => {
      const xScale = chart.scales?.x;
      if (!xScale) return;
      const ctx = chart.ctx as CanvasRenderingContext2D;
      ctx.save();
      const chartBottom = chart.chartArea?.bottom ?? 0;

      const ds = chart.data.datasets?.[0] as unknown as {
        startMs?: number[];
        endMs?: number[];
      };
      const starts: number[] = (ds && ds.startMs) || [];
      const ends: number[] = (ds && ds.endMs) || [];
      const now = typeof nowMs === "number" ? nowMs : Date.now();

      for (let i = 0; i < xScale.ticks.length; i++) {
        const tick = xScale.ticks[i];
        const idx = typeof (tick as { index?: number }).index === "number" ? (tick as { index?: number }).index! : i;
        const x = typeof xScale.getPixelForTick === "function"
          ? xScale.getPixelForTick(idx)
          : xScale.getPixelForValue?.(tick.value) ?? 0;
        const isMajor = !!tick.label;
        const s = starts[idx];
        const e = ends[idx];
        const isActive = typeof s === "number" && typeof e === "number" && now >= s && now < e;
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
