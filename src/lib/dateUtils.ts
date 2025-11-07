import { LOCALES, TIMEZONES, MS } from './constants';

export function formatTimeLocal(date: Date) {
  return date.toLocaleTimeString(LOCALES.EN_US, {
    timeZone: TIMEZONES.LONDON,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
