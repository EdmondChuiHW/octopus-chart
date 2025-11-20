import type { ConsumerConfig } from '../lib/types';
import StartTimeHint from './StartTimeHint';
import type { PricePoint } from '../lib/pointUtils';
import CheapestPeriod from './CheapestPeriod';

export type Props = {
  config: ConsumerConfig;
  relativeNow: Date | number;

  bestStartTimePoints: PricePoint[];
};

export default function Consumer({
  config: { name, duration, timers },
  relativeNow,
  bestStartTimePoints: points,
}: Props) {
  return (
    <>
      <h2>{name}</h2>
      <CheapestPeriod
        points={points}
        period={{ index: 0, length: points.length }}
      />
      <StartTimeHint
        relativeNow={relativeNow}
        startMs={points.length === 0 ? -1 : points[0].startMs}
        duration={duration}
        timers={timers}
      />
    </>
  );
}
