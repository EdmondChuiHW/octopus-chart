export function isoOffsetHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function formatTimeLocal(date: Date) {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Europe/London',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getLocalDateKey(date: Date) {
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
  });
}
