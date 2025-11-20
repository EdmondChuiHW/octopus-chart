import type { ConsumerConfig, TimerChoice } from '../lib/types';
import StartTimeHint from './StartTimeHint';
import type { PricePoint } from '../lib/pointUtils';
import CheapestPeriod from './CheapestPeriod';
import { useMemo } from 'react';
import { timerSetTimeMs } from '../lib/timerUtils';
import { isAfter } from 'date-fns';
import StartTimeHintChart from './StartTimeHintChart';

export type Props = {
  config: ConsumerConfig;
  relativeNow: Date | number;

  bestStartTimePoints: PricePoint[];
};

export default function Consumer({
  config,
  relativeNow,
  bestStartTimePoints: points,
}: Props) {
  const { name, duration, timers } = config;
  const startMs = points.length === 0 ? -1 : points[0].startMs;
  const choices = useMemo<TimerChoice[]>(() => {
    if (startMs < 0) {
      return [];
    }

    return timers
      .flatMap((timer) => {
        const setTime = timerSetTimeMs(startMs, timer, duration);
        if (isAfter(setTime, relativeNow)) {
          return { timer, setTime };
        }
        return [];
      })
      .sort((a, b) => a.setTime.getTime() - b.setTime.getTime());
  }, [relativeNow, startMs, duration, timers]);

  return (
    <>
      <h2>{name}</h2>
      <CheapestPeriod
        points={points}
        period={{ index: 0, length: points.length }}
      />
      <StartTimeHint choices={choices} startMs={startMs} />

      {choices[0] && (
        <StartTimeHintChart
          relativeNow={relativeNow}
          choice={choices[0]}
          consumer={config}
          periodPoints={points}
        />
      )}
    </>
  );
}
