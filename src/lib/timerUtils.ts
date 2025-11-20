import { add, sub, type Duration } from 'date-fns';
import type { Timer } from './types';

export function timerSetTimeMs(
  targetMs: number,
  timer: Timer,
  runTimeDuration?: Duration,
): Date {
  switch (timer.mode) {
    case 'starts-in':
      return sub(targetMs, timer.duration);
    case 'ends-in': {
      if (!runTimeDuration) {
        throw new Error(
          'runTimeDuration is required for ends-in timer mode to calculate start time',
        );
      }
      const endTime = add(targetMs, runTimeDuration);
      return sub(endTime, timer.duration);
    }
    default:
      throw new Error(`Unknown timer mode: ${timer.mode satisfies never}`);
  }
}

export function timerStartTimeMs(
  setTime: number | Date,
  timer: Timer,
  runTimeDuration?: Duration,
): Date {
  switch (timer.mode) {
    case 'starts-in':
      return add(setTime, timer.duration);
    case 'ends-in': {
      if (!runTimeDuration) {
        throw new Error(
          'runTimeDuration is required for ends-in timer mode to calculate start time',
        );
      }
      const endTime = add(setTime, timer.duration);
      return sub(endTime, runTimeDuration);
    }
    default:
      throw new Error(`Unknown timer mode: ${timer.mode satisfies never}`);
  }
}
