import { milliseconds } from 'date-fns';
import {
  formatShortDurationHoursMinsOnly,
  formatTimeLocal,
} from '../lib/dateUtils';
import type { TimerChoice } from '../lib/types';

import './StartTimeHint.css';
import { ColorText } from './ColorText';
import RadioForm from './RadioForm';

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
    return <div>Best start time unavailable. Start anytime.</div>;
  }

  if (choices.length === 0) {
    return (
      <>
        No timers applicable.{' '}
        <div>
          Start manually at{' '}
          <ColorText type="start">{formatTimeLocal(startMs)}</ColorText>.
        </div>
      </>
    );
  }

  return (
    <RadioForm legend="Timer options">
      {choices.map((choice, index) => {
        const key = `${choice.setTime.getTime()}-${choice.timer.mode}-${milliseconds(
          choice.timer.duration,
        )}`;
        return (
          <label
            key={key}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <input
              type="radio"
              name="timerChoice"
              value={key}
              checked={index === selectedChoiceIndex}
              onChange={() => onChoiceChange?.(index)}
              style={{ marginInlineEnd: '4px' }}
            />
            <TimerHint choice={choice} />
          </label>
        );
      })}
    </RadioForm>
  );
}

function TimerHint({ choice }: { choice: TimerChoice }) {
  const setTimeStr = formatTimeLocal(choice.setTime);
  const modeStr = (() => {
    switch (choice.timer.mode) {
      case 'starts-in':
        return 'start';
      case 'ends-in':
        return 'end';
      default:
        throw new Error(
          `Unknown timer mode: ${choice.timer.mode satisfies never}`,
        );
    }
  })();
  return (
    <span style={{ textAlign: 'start' }}>
      At{' '}
      <ColorText type="set" radioFormAware>
        {setTimeStr}
      </ColorText>
      , set to{' '}
      <ColorText type={modeStr} radioFormAware>
        {modeStr}
      </ColorText>{' '}
      in <b>{formatShortDurationHoursMinsOnly(choice.timer.duration)}</b>
    </span>
  );
}
