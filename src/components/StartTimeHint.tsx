import { milliseconds } from 'date-fns';
import {
  formatShortDurationHoursMinsOnly,
  formatTimeLocal,
} from '../lib/dateUtils';
import type { TimerChoice } from '../lib/types';

import './StartTimeHint.css';
import { useMemo, type PropsWithChildren } from 'react';
import { COLORS } from '../lib/colors';
import { ShowMoreList } from './ShowMoreList';

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
        <ColorText type="start">{formatTimeLocal(startMs)}</ColorText>
      </>
    );
  }

  return (
    <>
      <form className="start-time-hint">
        <fieldset>
          <legend>Timer options</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <ShowMoreList>
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
            </ShowMoreList>
          </div>
        </fieldset>
      </form>
    </>
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
    <>
      At <ColorText type="set">{setTimeStr}</ColorText>, set to{' '}
      <ColorText type={modeStr}>{modeStr}</ColorText> in{' '}
      <b>{formatShortDurationHoursMinsOnly(choice.timer.duration)}</b>
    </>
  );
}

function ColorText({
  type,
  children,
}: PropsWithChildren<{ type: 'set' | 'start' | 'end' }>) {
  const colour = useMemo(() => {
    switch (type) {
      case 'set':
        return COLORS.PRIMARY_BLUE;
      case 'start':
        return COLORS.TIMER.START;
      case 'end':
        return COLORS.TIMER.END;
      default:
        throw new Error(`Unknown type: ${type satisfies never}`);
    }
  }, [type]);

  return (
    <span
      style={{
        textDecorationColor: colour,
        textDecorationLine: 'underline',
        textDecorationThickness: '3px',
        textUnderlineOffset: '4px',
        // textUnderlinePosition: 'under',
        fontWeight: 'bold',
      }}
    >
      {children}
    </span>
  );
}
