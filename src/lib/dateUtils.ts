import { LOCALES, TIMEZONES, MS } from './constants';

export function isoOffsetHours(hours: number) {
  return new Date(Date.now() + hours * MS.PER_HOUR).toISOString();
}

export function formatTimeLocal(date: Date) {
  return date.toLocaleTimeString(LOCALES.EN_US, {
    timeZone: TIMEZONES.LONDON,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getLocalDateKey(date: Date) {
  return date.toLocaleDateString(LOCALES.EN_GB, {
    timeZone: TIMEZONES.LONDON,
  });
}
