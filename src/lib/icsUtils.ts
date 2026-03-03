import { createEvent, type EventAttributes } from 'ics';
import { formatShortDurationHoursMinsOnly } from './dateUtils';
import type { TimerChoice } from './types';
import { getTime, type DateArg } from 'date-fns';

function buildEventUri(
  startMs: number,
  summary: string,
  description: string,
  deepLinkUrl: string,
): string {
  const event: EventAttributes = {
    start: startMs,
    startInputType: 'utc',
    duration: { minutes: 30 },
    title: summary,
    description: description,
    url: deepLinkUrl,
    alarms: [
      {
        action: 'display',
        description: `Reminder: ${summary}`,
        trigger: { seconds: 10, before: true },
      },
    ],
  };

  const { error, value } = createEvent(event);
  if (error || !value) {
    console.error('Failed to generate ICS:', error);
    return '';
  }

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(value)}`;
}

export function generateICSUri(
  choice: TimerChoice,
  applianceName: string,
  deepLinkUrl: string,
): string {
  const dtStart = choice.setTime;

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
  const durationStr = formatShortDurationHoursMinsOnly(choice.timer.duration);

  const summary = `Set ${applianceName} to ${modeStr} in ${durationStr}`;
  const description = `Time to set your ${applianceName} to ${modeStr} in ${durationStr}.`;
  return buildEventUri(dtStart.getTime(), summary, description, deepLinkUrl);
}

export function generateICSUriManual(
  startMs: DateArg<Date>,
  applianceName: string,
  deepLinkUrl: string,
): string {
  const dtStart = getTime(startMs);

  const summary = `Start ${applianceName}`;
  const description = `Time to start your ${applianceName}.`;
  return buildEventUri(dtStart, summary, description, deepLinkUrl);
}
