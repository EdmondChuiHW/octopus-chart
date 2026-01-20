import type { PricePoint } from '../lib/pointUtils';
import type { ConsumerBestTimes } from '../lib/types';
import Consumer from './Consumer';

export type Props = {
  consumers: ConsumerBestTimes[];
  relativeNow: Date | number;
  points: PricePoint[];
};

export default function ConsumerList({ consumers, relativeNow }: Props) {
  return (
    <>
      {consumers.map(({ config, bestStartTimePointsList }) => {
        return (
          <Consumer
            key={config.name}
            config={config}
            relativeNow={relativeNow}
            bestStartTimePointsList={bestStartTimePointsList}
          />
        );
      })}
    </>
  );
}
