import { formatDuration, milliseconds } from 'date-fns';
import { formatTimeLocal } from '../lib/dateUtils';
import type { TimerChoice } from '../lib/types';

import './StartTimeHint.css';

export type Props = {
  startMs: number;
  choices: TimerChoice[];

  selectedChoiceIndex?: number;
  onChoiceChange?: (index: number) => void;
};

export default function StartTimeHint({
  startMs,
  choices,
  selectedChoiceIndex,
  onChoiceChange,
}: Props) {
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
      <form className="start-time-hint">
        <fieldset>
          <legend>Timer options</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {choices.map((choice, index) => {
              const key = `${choice.setTime.getTime()}-${choice.timer.mode}-${milliseconds(
                choice.timer.duration,
              )}`;
              return (
                <label key={key}>
                  <input
                    type="radio"
                    name="timerChoice"
                    value={key}
                    checked={index === selectedChoiceIndex}
                    onChange={() => onChoiceChange?.(index)}
                  />
                  <TimerHint choice={choice} />
                </label>
              );
            })}
          </div>
        </fieldset>
      </form>
    </>
  );
}

function TimerHint({ choice }: { choice: TimerChoice }) {
  const setTimeStr = formatTimeLocal(choice.setTime);
  const modeStr = choice.timer.mode === 'starts-in' ? 'start' : 'end';
  return (
    <>
      At <b>{setTimeStr}</b>, set to <b>{modeStr}</b> in{' '}
      <b>{formatDuration(choice.timer.duration)}</b>
    </>
  );
}
