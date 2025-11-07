import {
  CategoryScale,
  type ChartArea,
  type ChartComponent,
  type LabelItem,
} from 'chart.js';

export class MyBarScale extends CategoryScale implements ChartComponent {
  getLabelItems(chartArea?: ChartArea): LabelItem[] {
    const input = super.getLabelItems(chartArea);
    const output: LabelItem[] = [];
    const drawLast: LabelItem[] = [];

    for (const item of input) {
      const isBackdrop = item.options.backdrop?.color;
      if (isBackdrop) {
        drawLast.push(item);
      } else {
        output.push(item);
      }
    }

    return output.concat(drawLast);
  }
}

// use built-in scale ID to lie to TS lol
MyBarScale.id = 'timeseries';
