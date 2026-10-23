// Minimal RFC 5545 calendar event with a reminder alarm. Replaces the `ics`
// package (and its `yup` dependency), which was ~120 kB of the app bundle.

function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

function icsText(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
}

/** Folds content lines longer than 75 characters (RFC 5545 §3.1). */
function fold(line: string): string {
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74)
    parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join('\r\n');
}

export function generateICSUri(
  start: Date | number,
  deepLinkUrl: string,
  summary: string,
  description: string,
): string {
  const startMs = typeof start === 'number' ? start : start.getTime();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:agile-octopus-chart',
    'METHOD:PUBLISH',
    'X-PUBLISHED-TTL:PT1H',
    'BEGIN:VEVENT',
    `UID:${startMs}-${encodeURIComponent(summary)}@agile-octopus-chart`,
    `SUMMARY:${icsText(summary)}`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(startMs)}`,
    `DESCRIPTION:${icsText(description)}`,
    `URL:${deepLinkUrl}`,
    'DURATION:PT30M',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`Reminder: ${summary}`)}`,
    'TRIGGER:-PT10S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const value = lines.map(fold).join('\r\n') + '\r\n';
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(value)}`;
}
