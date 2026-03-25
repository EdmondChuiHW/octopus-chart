import type { DateArg } from 'date-fns';
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
    | { type: 'manual'; time: DateArg<Date>; choice?: undefined }
  );

const IS_IOS =
  typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function RemindButton(props: Props) {
  const { type, time, choice, isIos = IS_IOS } = props;

  const { uri, fileName } = useMemo(
    () => makeUri(props, isIos),
    [props, isIos],
  );

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
    <>
      <a href={uri} download={fileName} className="btn remind-me-btn">
        Remind me at {displayTime}
      </a>
    </>
  );
}

function makeSummaryAndDescription(props: Props) {
  const { type, time, choice, applianceName } = props;
  switch (type) {
    case 'choice': {
      const modeStr = choice.timer.mode === 'starts-in' ? 'start' : 'end';
      const durationStr = formatShortDurationHoursMinsOnly(
        choice.timer.duration,
      );
      return {
        summary: `Set ${applianceName} to ${modeStr} in ${durationStr}`,
        description: `Time to set your ${applianceName} to ${modeStr} in ${durationStr}.`,
      };
    }
    case 'manual':
      return {
        summary: `Start ${applianceName} at ${formatTimeLocal(time)}`,
        description: `Time to start your ${applianceName}.`,
      };
    default:
      throw new Error(`Unsupported type: ${type satisfies never}`);
  }
}

function makeUri(props: Props, isIos: boolean) {
  const { summary, description } = makeSummaryAndDescription(props);
  const startMs = getIcsStartMs(props);
  const deepLinkUrl = window.location.href;
  if (isIos) {
    return {
      uri: makeIosShortcutUri(startMs, summary, deepLinkUrl),
      fileName: undefined,
    };
  } else {
    return {
      uri: generateICSUri(startMs, deepLinkUrl, summary, description),
      fileName: `${props.applianceName.replace(/[^a-zA-Z0-9]/g, '_')}_Reminder.ics`,
    };
  }
}

function makeIosShortcutUri(
  startTime: DateArg<Date>,
  summary: string,
  deepLinkUrl: string,
) {
  const shortcutName = 'Start Appliance Reminder';
  const payload = `v=1&n=${summary}&t=${formatISO(startTime)}&u=${deepLinkUrl}`;

  return `shortcuts://run-shortcut?name=${encodeURIComponent(
    shortcutName,
  )}&input=text&text=${encodeURIComponent(payload)}`;
}

function getIcsStartMs(props: Props): DateArg<Date> {
  const { type } = props;
  switch (type) {
    case 'choice':
      return props.choice.setTime;
    case 'manual':
      return props.time;
    default:
      throw new Error(`Unsupported type: ${type satisfies never}`);
  }
}
