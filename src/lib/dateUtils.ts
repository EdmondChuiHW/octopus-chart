import {
  format,
  getMinutes,
  type DateArg,
  type Duration,
  type FormatDistanceFn,
  type FormatDistanceToken,
  formatDuration,
  milliseconds,
  millisecondsToHours,
  millisecondsToMinutes,
} from 'date-fns';
import { millisecondsInHour } from 'date-fns/constants';

export function formatTimeLocal(date: DateArg<Date>): string {
  if (getMinutes(date) === 0) {
    return format(date, 'haaa');
  }

  return format(date, 'h:mmaaa');
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
