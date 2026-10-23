import { memo } from 'react';
import type { PricePoint } from '../lib/pointUtils';
import type { ConsumerConfig } from '../lib/types';
import Consumer from './Consumer';
import ConsumerEdit from './ConsumerEdit';

export type Props = {
  consumers: ConsumerConfig[];
  relativeNow: Date | number;
  points: PricePoint[];
};

// Memoised so hovering the charts doesn't re-render every consumer.
export default memo(function ConsumerList({
  consumers,
  relativeNow,
  points,
}: Props) {
  return (
    <>
      {consumers.map((config) => (
        <Consumer
          key={config.name}
          config={config}
          relativeNow={relativeNow}
          points={points}
        />
      ))}
      <ConsumerEdit relativeNow={relativeNow} points={points} />
    </>
  );
});
