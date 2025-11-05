import { Bar } from 'react-chartjs-2';
import type { ChartOptions, ChartData, Plugin } from 'chart.js';

type Props = {
  data: ChartData<'bar', number[], string>;
  options: ChartOptions<'bar'>;
  plugins?: Plugin<'bar'>[];
};

export default function PriceChart({ data, options, plugins }: Props) {
  return <Bar options={options} data={data} plugins={plugins} />;
}
