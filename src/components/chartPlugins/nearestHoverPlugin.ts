import type { Plugin, Chart } from 'chart.js';
import { Interaction } from 'chart.js';
import { getAngleFromPoint, getRelativePosition } from 'chart.js/helpers';

// Plugin that draws a radial line on a polar clock which follows the user's pointer.
// Store per-chart state in a WeakMap so we don't modify the Chart instance.

type PointerState = {
  handlers: {
    move: (e: PointerEvent) => void;
    leave: (e: PointerEvent) => void;
  };
};

export function nearestHoverPluginFactory(
  onHover: (index: number) => void,
): Plugin<'polarArea'> {
  const pointerState = new WeakMap<Chart, PointerState>();
  const plugin: Plugin<'polarArea'> = {
    id: 'nearestHoverPlugin',

    // Attach pointer event listeners so the line follows the user's pointer over the canvas.
    afterInit: (chart: Chart) => {
      // If handlers already attached, don't attach again
      if (pointerState.has(chart)) return;

      const canvas = chart.canvas;

      const onMove = (ev: PointerEvent) => {
        const pos = getRelativePosition(ev, chart);
        let found = -1;
        Interaction.evaluateInteractionItems(
          chart,
          'r',
          pos,
          (el, datasetIndex, index) => {
            if (datasetIndex !== 1) return;

            // Nov 10, 2025 https://github.com/chartjs/Chart.js/blob/e8c58daf72341c006313ee891facad326ac1c2a9/src/core/core.interaction.js#L142
            const { startAngle, endAngle } = el.getProps(
              ['startAngle', 'endAngle'],
              true,
            ) as { startAngle: number; endAngle: number };
            const { angle } = getAngleFromPoint(el, { x: pos.x, y: pos.y });

            if (_angleBetween(angle, startAngle, endAngle)) {
              found = index;
            }
          },
          false,
        );
        onHover(found);
      };

      const onLeave = () => {
        onHover(-1);
      };

      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerout', onLeave);

      pointerState.set(chart, {
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
  };

  return plugin;
}

// Nov 10, 2025 https://github.com/chartjs/Chart.js/blob/e8c58daf72341c006313ee891facad326ac1c2a9/src/helpers/helpers.math.ts#L167
const PI = Math.PI;
const TAU = 2 * PI;

function _angleBetween(
  angle: number,
  start: number,
  end: number,
  sameAngleIsFullCircle?: boolean,
) {
  const a = _normalizeAngle(angle);
  const s = _normalizeAngle(start);
  const e = _normalizeAngle(end);
  const angleToStart = _normalizeAngle(s - a);
  const angleToEnd = _normalizeAngle(e - a);
  const startToAngle = _normalizeAngle(a - s);
  const endToAngle = _normalizeAngle(a - e);
  return (
    a === s ||
    a === e ||
    (sameAngleIsFullCircle && s === e) ||
    (angleToStart > angleToEnd && startToAngle < endToAngle)
  );
}

function _normalizeAngle(a: number) {
  return ((a % TAU) + TAU) % TAU;
}
