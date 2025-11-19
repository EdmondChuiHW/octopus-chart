import type { Chart, Plugin } from 'chart.js';
import type { PricePoint } from '../../lib/pointUtils';
import { getMinutes } from 'date-fns';

export function axisTickPluginFactory(): Plugin<'bar'> {
  const plugin: Plugin<'bar'> = {
    id: 'axisTickPlugin',
    afterDraw: (c: Chart) => {
      const chart = c as Chart<'bar', PricePoint[]>;
      const xScale = chart.scales.x;
      const chartBottom = chart.chartArea.bottom;
      const ctx = chart.ctx;
      ctx.save();

      const points = chart.data.datasets[0].data;
      const activeIndex = chart
        .getActiveElements()
        .find((el) => el.datasetIndex === 0)?.index;

      for (let index = 0; index < points.length; index++) {
        const isActive = index === activeIndex;
        const xAdjust = isActive ? 2 : 0;
        const x = xScale.getPixelForValue(index - 0.5) + xAdjust;
        const point = points[index];

        const isMajor = getMinutes(point.startMs) === 0;
        const len = isMajor ? 10 : 6;
        ctx.beginPath();
        ctx.strokeStyle = isActive
          ? 'rgba(0,120,212,0.95)'
          : 'rgba(234,246,255,0.9)';
        ctx.lineWidth = isActive ? 4 : isMajor ? 2 : 1;
        ctx.moveTo(x, chartBottom + 0.5);
        ctx.lineTo(x, chartBottom + len + 0.5);
        ctx.stroke();
      }

      ctx.restore();
    },
  };
  return plugin;
}
