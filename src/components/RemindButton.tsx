import type { DateArg } from 'date-fns';
import { useMemo } from 'react';
import { formatTimeLocal } from '../lib/dateUtils';
import { generateICSUri, generateICSUriManual } from '../lib/icsUtils';
import type { TimerChoice } from '../lib/types';

import './RemindButton.css';

type BaseProps = {
  applianceName: string;
};

export type Props = BaseProps &
  (
    | { type: 'choice'; time?: undefined; choice: TimerChoice }
    | { type: 'manual'; time: DateArg<Date>; choice?: undefined }
  );

export function RemindButton({ type, time, choice, applianceName }: Props) {
  const uri = useMemo(() => {
    switch (type) {
      case 'choice':
        return generateICSUri(choice, applianceName, window.location.href);
      case 'manual':
        return generateICSUriManual(time, applianceName, window.location.href);
      default:
        throw new Error(`Unsupported type: ${type satisfies never}`);
    }
  }, [applianceName, choice, time, type]);

  const fileName = useMemo(() => {
    return `${applianceName.replace(/[^a-zA-Z0-9]/g, '_')}_Reminder.ics`;
  }, [applianceName]);

  const displayTime = useMemo(() => {
    switch (type) {
      case 'choice':
        return formatTimeLocal(choice.setTime);
      case 'manual':
        return formatTimeLocal(time);
      default:
        throw new Error(`Unsupported type: ${type satisfies never}`);
    }
  }, [choice?.setTime, time, type]);

  return (
    <a href={uri} download={fileName} className="btn remind-me-btn">
      Remind me at {displayTime}
    </a>
  );
}
