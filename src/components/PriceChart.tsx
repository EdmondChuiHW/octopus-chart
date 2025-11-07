import { Bar } from 'react-chartjs-2';
import type { ChartOptions, ChartData, Plugin } from 'chart.js';
import type { Point } from '../lib/pointUtils';

type Props = {
  data: ChartData<'bar', Point[], string>;
  options: ChartOptions<'bar'>;
  plugins?: Plugin<'bar'>[];
};

export default function PriceChart({ data, options, plugins }: Props) {
  return <Bar options={options} data={data} plugins={plugins} />;
}
