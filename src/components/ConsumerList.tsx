import type { PricePoint } from '../lib/pointUtils';
import type { ConsumerBestTimes } from '../lib/types';
import Consumer from './Consumer';
import ConsumerEdit from './ConsumerEdit';

export type Props = {
  consumers: ConsumerBestTimes[];
  relativeNow: Date | number;
  points: PricePoint[];
};

export default function ConsumerList({
  consumers,
  relativeNow,
  points,
}: Props) {
  return (
    <>
      {consumers.map(({ config }) => {
        return (
          <Consumer
            key={config.name}
            config={config}
            relativeNow={relativeNow}
            points={points}
          />
        );
      })}
      <ConsumerEdit relativeNow={relativeNow} points={points} />
    </>
  );
}
