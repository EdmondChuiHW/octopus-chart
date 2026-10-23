// Tree-shaken ECharts: only the series/components the app uses, SVG renderer.
// SVG keeps memory flat for the tall "All periods" chart (a canvas there is
// rows × 44px × devicePixelRatio²) and renders crisply at any zoom.
import { use as registerECharts, type ComposeOption } from 'echarts/core';
import {
  BarChart,
  LineChart,
  type BarSeriesOption,
  type LineSeriesOption,
} from 'echarts/charts';
import {
  GridSimpleComponent, // grid without axisPointer (~60 kB less)
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  type GridComponentOption,
  type MarkLineComponentOption,
  type MarkPointComponentOption,
  type PolarComponentOption,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

registerECharts([
  BarChart,
  LineChart,
  GridSimpleComponent,
  PolarComponent,
  MarkLineComponent,
  MarkPointComponent,
  SVGRenderer,
]);

export { init, getInstanceByDom, type ECharts } from 'echarts/core';

export type ChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | PolarComponentOption
  | MarkLineComponentOption
  | MarkPointComponentOption
>;

/** Shared defaults: no animation (instant first paint & hover sync). */
export const BASE_OPTION = {
  animation: false,
  textStyle: { fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif' },
} satisfies ChartOption;

export type MarkPointItem = NonNullable<
  MarkPointComponentOption['data']
>[number];
export type MarkLineItem = NonNullable<MarkLineComponentOption['data']>[number];
