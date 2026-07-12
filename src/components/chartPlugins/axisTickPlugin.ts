import type { Chart, Plugin } from 'chart.js';
import type { PricePoint } from '../../lib/pointUtils';
import { getMinutes } from 'date-fns';
import { COLORS } from '../../lib/colors';

export function axisTickPluginFactory(
  scaleId = 'x',
  activeTickOffset = 2,
): Plugin<'bar'> {
  const plugin: Plugin<'bar'> = {
    id: 'axisTickPlugin',
    afterDraw: (c: Chart) => {
      const chart = c as Chart<'bar', PricePoint[]>;
      const scale = chart.scales[scaleId];
      const isHorizontal = scale.isHorizontal();
      const chartAnchor = isHorizontal
        ? chart.chartArea.bottom
        : chart.chartArea.left;
      const ctx = chart.ctx;
      ctx.save();

      const points = chart.data.datasets[0].data;
      const activeIndex = chart
        .getActiveElements()
        .find((el) => el.datasetIndex === 0)?.index;

      for (let index = 0; index < points.length; index++) {
        const point = points[index];

        const isActive = index === activeIndex;
        const offset = isActive ? activeTickOffset : 0;
        const pixel =
          scale.getPixelForValue(
            point.isConfirmed ? index - 0.5 : index - 0.15,
          ) + offset;
        const isMajor = getMinutes(point.startMs) === 0;
        const len = isMajor ? 10 : 6;

        ctx.beginPath();
        ctx.strokeStyle = isActive
          ? point.isConfirmed
            ? 'rgba(0,120,212,0.95)'
            : COLORS.PREDICTION
          : 'rgba(234,246,255,0.9)';
        ctx.lineWidth = isActive ? 4 : isMajor ? 2 : 1;

        if (isHorizontal) {
          ctx.moveTo(pixel, chartAnchor + 0.5);
          ctx.lineTo(pixel, chartAnchor + len + 0.5);
        } else {
          ctx.moveTo(chartAnchor - 0.5, pixel);
          ctx.lineTo(chartAnchor - len - 0.5, pixel);
        }

        ctx.stroke();
      }

      ctx.restore();
    },
  };
  return plugin;
}
