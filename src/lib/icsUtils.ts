import { createEvent, type EventAttributes } from 'ics';
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
  startMs: DateArg<Date>,
  deepLinkUrl: string,
  summary: string,
  description: string,
): string {
  const dtStart = getTime(startMs);

  return buildEventUri(dtStart, summary, description, deepLinkUrl);
}
