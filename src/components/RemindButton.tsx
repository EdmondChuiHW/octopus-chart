import { formatISO } from 'date-fns';
import { useMemo } from 'react';
import {
  formatShortDurationHoursMinsOnly,
  formatTimeLocal,
} from '../lib/dateUtils';
import { generateICSUri } from '../lib/icsUtils';
import type { TimerChoice } from '../lib/types';

import './RemindButton.css';

type BaseProps = {
  applianceName: string;
  isIos?: boolean;
};

export type Props = BaseProps &
  (
    | { type: 'choice'; time?: undefined; choice: TimerChoice }
    | { type: 'manual'; time: Date | number; choice?: undefined }
  );

const IS_IOS =
  typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function RemindButton({
  applianceName,
  choice,
  time,
  isIos = IS_IOS,
}: Props) {
  const remindAt = choice ? choice.setTime : time;
  const { uri, fileName } = useMemo(() => {
    const { summary, description } = describe(applianceName, choice, remindAt);
    const deepLinkUrl = window.location.href;
    if (isIos) {
      return {
        uri: makeIosShortcutUri(remindAt, summary, deepLinkUrl),
        fileName: undefined,
      };
    }
    return {
      uri: generateICSUri(remindAt, deepLinkUrl, summary, description),
      fileName: `${applianceName.replace(/[^a-zA-Z0-9]/g, '_')}_Reminder.ics`,
    };
  }, [applianceName, choice, remindAt, isIos]);

  return (
    <a href={uri} download={fileName} className="btn remind-me-btn">
      Remind me at {formatTimeLocal(remindAt)}
    </a>
  );
}

function describe(
  applianceName: string,
  choice: TimerChoice | undefined,
  time: Date | number,
) {
  if (!choice) {
    return {
      summary: `Start ${applianceName} at ${formatTimeLocal(time)}`,
      description: `Time to start your ${applianceName}.`,
    };
  }
  const modeStr = choice.timer.mode === 'starts-in' ? 'start' : 'end';
  const durationStr = formatShortDurationHoursMinsOnly(choice.timer.duration);
  return {
    summary: `Set ${applianceName} to ${modeStr} in ${durationStr}`,
    description: `Time to set your ${applianceName} to ${modeStr} in ${durationStr}.`,
  };
}

function makeIosShortcutUri(
  startTime: Date | number,
  summary: string,
  deepLinkUrl: string,
) {
  const shortcutName = 'Start Appliance Reminder';
  const payload = `v=1&n=${summary}&t=${formatISO(startTime)}&u=${deepLinkUrl}`;

  return `shortcuts://run-shortcut?name=${encodeURIComponent(
    shortcutName,
  )}&input=text&text=${encodeURIComponent(payload)}`;
}
