import type { Chart, Plugin, ChartDataset } from 'chart.js';
import type { Point } from '../../lib/pointUtils';
import { getMinutes } from 'date-fns';

export function axisTickPluginFactory(): Plugin<'bar'> {
  const plugin: Plugin<'bar'> = {
    id: 'axisTickPlugin',
    afterDraw: (chart: Chart) => {
      const xScale = chart.scales.x;
      const chartBottom = chart.chartArea.bottom;
      const ctx = chart.ctx;
      ctx.save();

      type ExtDs = ChartDataset<'bar', Point[]>;
      const points = (chart.data.datasets as ExtDs[])[0].data;

      for (let tickIndex = 0; tickIndex < xScale.ticks.length; tickIndex++) {
        const x = xScale.getPixelForTick(tickIndex);
        const pointIndex = xScale.ticks[tickIndex].value;

        const point = points.at(pointIndex);
        if (!point) continue;

        const isMajor = getMinutes(point.startMs) === 0;
        const isActive = point.status === 'active';
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
