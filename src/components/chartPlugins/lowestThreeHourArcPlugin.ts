import type { Plugin, Chart, ChartDataset } from 'chart.js';
import { RadialLinearScale } from 'chart.js';
import { COLORS } from '../../lib/constants';

// Draw a subtle arc around the clock highlighting the contiguous 3-hour block
// (6 half-hour steps) with the lowest total rate. The plugin inspects the
// chart data (dataset 0) and labels to find the best window and draws a
// stroked arc on the outer radius.
export function lowestThreeHourArcPluginFactory(): Plugin<'polarArea'> {
  const plugin: Plugin<'polarArea'> = {
    id: 'lowestThreeHourArc',
    afterDraw: (chart: Chart) => {
      const ctx = chart.ctx;
      const scale = chart.scales.r;
      if (!(scale instanceof RadialLinearScale)) return;

      const labels = chart.data.labels ?? [];
      // data from the primary dataset (may be unknown-typed from Chart.js types)
      const first = chart.data.datasets[0] as
        | ChartDataset<'polarArea', unknown[]>
        | undefined;
      const ds = first?.data ?? [];
      const presenceDataset = chart.data.datasets[1] as
        | ChartDataset<'polarArea', unknown[]>
        | undefined;
      const presence = presenceDataset?.data ?? [];
      const count = Math.max(labels.length, ds.length, presence.length);
      if (count === 0) return;

      const windowSize = 6; // 6 half-hour steps = 3 hours
      if (count < windowSize) return;

      // Find contiguous window of size windowSize where all labels exist and
      // the sum of dataset[0] values is minimal.
      let bestIdx = -1;
      let bestSum = Number.POSITIVE_INFINITY;
      for (let i = 0; i <= count - windowSize; i++) {
        let ok = true;
        let sum = 0;
        for (let k = 0; k < windowSize; k++) {
          // require the corresponding 'hit' dataset entry to indicate presence
          const present = presence[i + k];
          if (typeof present !== 'number' || present <= 0) {
            ok = false;
            break;
          }

          const v = ds[i + k];
          if (typeof v !== 'number') {
            ok = false;
            break;
          }
          sum += v;
        }
        if (!ok) continue;
        if (sum < bestSum) {
          bestSum = sum;
          bestIdx = i;
        }
      }

      if (bestIdx < 0) return;

      const cx = chart.width / 2;
      const cy = chart.height / 2;
      const rOuter = scale.drawingArea;

      const segmentAngle = (Math.PI * 2) / count;
      // Chart.js positions polar segments so that the visible "bar" is centered
      // between tick boundaries. Hour/half-hour ticks are at (i/count)*2pi - pi/2,
      // so the center of segment i is at ((i + 0.5)/count)*2pi - pi/2. Use that
      // to align the arc exactly to half-hour slots.
      const startCenter = ((bestIdx + 0.5) / count) * Math.PI * 2 - Math.PI / 2;
      const endCenter =
        ((bestIdx + windowSize - 1 + 0.5) / count) * Math.PI * 2 - Math.PI / 2;
      const startAngle = startCenter - segmentAngle / 2;
      const endAngle = endCenter + segmentAngle / 2;

      ctx.save();

      // Draw an outer stroked arc as a subtle but more visible highlight
      ctx.beginPath();
      const radius = Math.max(12, rOuter - 6);
      ctx.lineWidth = Math.max(6, Math.round(rOuter * 0.09));
      // use the stronger blue but keep it semi-transparent for subtlety
      ctx.strokeStyle = COLORS.PRIMARY_BLUE as string;
      ctx.globalAlpha = 0.28;
      // Use 'butt' so the stroke ends exactly at the arc endpoints and doesn't
      // extend beyond the arc (no extruding caps).
      ctx.lineCap = 'butt';
      ctx.arc(cx, cy, radius, startAngle, endAngle, false);
      ctx.stroke();

      ctx.restore();
    },
  };
  return plugin;
}
