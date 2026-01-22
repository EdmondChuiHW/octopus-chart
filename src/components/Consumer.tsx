import type { ConsumerConfig, TimerChoice } from '../lib/types';
import StartTimeHint from './StartTimeHint';
import type { PricePoint } from '../lib/pointUtils';
import { useMemo, useRef, useState } from 'react';
import { timerSetTimeMs } from '../lib/timerUtils';
import { isAfter, milliseconds, sub, type Duration } from 'date-fns';
import StartTimeHintChart from './StartTimeHintChart';

import './Consumer.css';
import { millisecondsInHour } from 'date-fns/constants';
import CheapestPeriodList from './CheapestPeriodList';
import useBestPeriods from '../hooks/useBestPeriods';
import { formatShortDurationHoursMinsOnly } from '../lib/dateUtils';

export type Props = {
  config: ConsumerConfig;
  relativeNow: Date | number;

  points: PricePoint[];

  customHeader?: React.ReactNode;
};

export default function Consumer({
  config,
  relativeNow,
  points: pointsFromProps,
  customHeader,
}: Props) {
  const { name, duration, timers } = config;

  const diffInHours = milliseconds(config.duration) / millisecondsInHour;
  const allPoints = useMemo(() => {
    return pointsFromProps.filter((p) => isAfter(p.startMs, relativeNow));
  }, [pointsFromProps, relativeNow]);
  const periods = useBestPeriods(allPoints, diffInHours);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);

  const prevConfig = useRef(config);
  if (prevConfig.current !== config) {
    prevConfig.current = config;
    setSelectedPeriod(0);
  }

  const points = useMemo(() => {
    const period = periods.at(selectedPeriod);
    if (!period) return [];

    if (period.index < 0 || period.index >= allPoints.length) return [];

    return allPoints.slice(period.index, period.index + period.length);
  }, [allPoints, selectedPeriod, periods]);

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

  const prevChoices = useRef(choices);
  if (prevChoices.current !== choices) {
    prevChoices.current = choices;
    setChoiceIndex(0);
  }

  const legend = useMemo(
    () => formatShortDurationHoursMinsOnly(config.duration),
    [config.duration],
  );

  return (
    <div className="consumer">
      {customHeader ?? <h2>{name}</h2>}
      <CheapestPeriodList
        points={allPoints}
        periods={periods}
        legend={`Period options (${legend})`}
        selectedIndex={selectedPeriod}
        onChange={setSelectedPeriod}
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
