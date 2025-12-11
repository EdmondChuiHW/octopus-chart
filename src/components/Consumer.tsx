import type { ConsumerConfig, TimerChoice } from '../lib/types';
import StartTimeHint from './StartTimeHint';
import type { PricePoint } from '../lib/pointUtils';
import CheapestPeriod from './CheapestPeriod';
import { useMemo, useState } from 'react';
import { timerSetTimeMs } from '../lib/timerUtils';
import { formatDuration, isAfter, sub, type Duration } from 'date-fns';
import StartTimeHintChart from './StartTimeHintChart';

import './Consumer.css';

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
        // TODO add UI indicator for late timers
        if (isAfter(setTime, sub(relativeNow, LOOKBACK_DURATION))) {
          return { timer, setTime };
        }
        return [];
      })
      .sort((a, b) => a.setTime.getTime() - b.setTime.getTime());
  }, [relativeNow, startMs, duration, timers]);

  const [choiceIndex, setChoiceIndex] = useState(0);

  return (
    <div className="consumer">
      <h2>{name}</h2>
      <small>Run time: {formatDuration(config.duration)}</small>
      <CheapestPeriod
        points={points}
        period={{ index: 0, length: points.length }}
      />
      <StartTimeHint
        choices={choices}
        startMs={startMs}
        selectedChoiceIndex={choiceIndex}
        onChoiceChange={setChoiceIndex}
      />

      {choices[choiceIndex] && (
        <StartTimeHintChart
          relativeNow={relativeNow}
          choice={choices[choiceIndex]}
          consumer={config}
          periodPoints={points}
        />
      )}
    </div>
  );
}

const LOOKBACK_DURATION: Duration = { minutes: 30 };
