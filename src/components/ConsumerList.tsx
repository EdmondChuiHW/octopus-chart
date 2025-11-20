import type { PricePoint } from '../lib/pointUtils';
import type { ConsumerConfig } from '../lib/types';
import Consumer from './Consumer';

export type Props = {
  consumers: { config: ConsumerConfig; bestStartTimePoints: PricePoint[] }[];
  relativeNow: Date | number;
  points: PricePoint[];
};

export default function ConsumerList({ consumers, relativeNow }: Props) {
  return (
    <>
      {consumers.map(({ config, bestStartTimePoints }) => {
        return (
          <Consumer
            key={config.name}
            config={config}
            relativeNow={relativeNow}
            bestStartTimePoints={bestStartTimePoints}
          />
        );
      })}
    </>
  );
}
