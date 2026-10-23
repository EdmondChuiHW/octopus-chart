import {
  type Duration,
  type FormatDistanceFn,
  type FormatDistanceToken,
  formatDuration,
  milliseconds,
  millisecondsToHours,
  millisecondsToMinutes,
} from 'date-fns';
import { millisecondsInHour } from 'date-fns/constants';

/** "3pm" / "3:30pm" in local time. (Hand-rolled: called for every point.) */
export function formatTimeLocal(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const h = d.getHours();
  const m = d.getMinutes();
  const time = `${h % 12 || 12}${m === 0 ? '' : `:${String(m).padStart(2, '0')}`}`;
  return `${time}${h < 12 ? 'am' : 'pm'}`;
}

const formatDistanceLocale: { [K in FormatDistanceToken]?: string } = {
  xMinutes: '{{count}}m',
  xHours: '{{count}}h',
};

const shortFormatDistance: FormatDistanceFn = (token, count) => {
  const template = formatDistanceLocale[token];
  if (!template) {
    throw new Error(`Unsupported token: ${token}`);
  }
  return template.replace('{{count}}', String(count));
};

export function formatShortDurationHoursMinsOnly(
  duration: Readonly<Duration>,
): string {
  const hourMins = collapseHoursMins(duration);
  return formatDuration(hourMins, {
    format: ['hours', 'minutes'],
    delimiter: '',
    locale: { formatDistance: shortFormatDistance },
  });
}

export function formatDurationHoursMinsOnly(
  duration: Readonly<Duration>,
): string {
  const hourMins = collapseHoursMins(duration);
  return formatDuration(hourMins);
}

function collapseHoursMins(duration: Readonly<Duration>): Readonly<Duration> {
  const ms = milliseconds(duration);

  const wholeHours = millisecondsToHours(ms);
  const subHours = ms - wholeHours * millisecondsInHour;
  const wholeMinutes = millisecondsToMinutes(subHours);
  // subMins are discarded

  return {
    hours: wholeHours,
    minutes: wholeMinutes,
  };
}
