import { formatDuration, milliseconds } from 'date-fns';
import { formatTimeLocal } from '../lib/dateUtils';
import type { TimerChoice } from '../lib/types';

export type Props = {
  startMs: number;
  choices: TimerChoice[];
};

export default function StartTimeHint({ startMs, choices }: Props) {
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
          <TimerHint
            choice={choice}
            key={`${choice.setTime.getTime()}-${choice.timer.mode}-${milliseconds(choice.timer.duration)}`}
          />
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
