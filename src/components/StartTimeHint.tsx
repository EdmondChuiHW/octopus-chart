import { add, formatDuration, isAfter, sub, type Duration } from 'date-fns';
import { useMemo } from 'react';
import { formatTimeLocal } from '../lib/dateUtils';
import type { Timer } from '../lib/types';

export type Props = {
  relativeNow: Date | number;
  startMs: number;
  duration: Duration;
  timers: Timer[];
};

type TimerChoice = {
  timer: Timer;
  setTime: Date;
};

export default function StartTimeHint({
  relativeNow,
  startMs,
  duration,
  timers,
}: Props) {
  const choices = useMemo<TimerChoice[]>(() => {
    return timers.flatMap((timer) => {
      const setTime = timerSetTimeMs(startMs, timer, duration);
      if (isAfter(setTime, relativeNow)) {
        return { timer, setTime };
      }
      return [];
    });
  }, [relativeNow, startMs, duration, timers]);

  if (startMs < 0) {
    return <>Best start time unavailable. Start anytime.</>;
  }

  if (choices.length === 0) {
    return (
      <>
        No timers applicable. Start manually at{' '}
        <b>{formatTimeLocal(startMs)}</b>
      </>
    );
  }

  return (
    <>
      <ol>
        {choices.map((choice) => (
          <TimerHint choice={choice} key={choice.setTime.getTime()} />
        ))}
      </ol>
    </>
  );
}

function TimerHint({ choice }: { choice: TimerChoice }) {
  const setTimeStr = formatTimeLocal(choice.setTime);
  const modeStr = choice.timer.mode === 'starts-in' ? 'start' : 'end';
  return (
    <li>
      At <b>{setTimeStr}</b>, set timer to <b>{modeStr}</b> in{' '}
      <b>{formatDuration(choice.timer.duration)}</b>
    </li>
  );
}

function timerSetTimeMs(
  targetMs: number,
  timer: Timer,
  duration: Duration,
): Date {
  switch (timer.mode) {
    case 'starts-in':
      return sub(targetMs, timer.duration);
    case 'ends-in': {
      const endTime = add(targetMs, duration);
      return sub(endTime, timer.duration);
    }
    default:
      throw new Error(`Unknown timer mode: ${timer.mode satisfies never}`);
  }
}
