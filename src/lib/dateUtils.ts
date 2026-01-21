import {
  format,
  getMinutes,
  type DateArg,
  type Duration,
  type FormatDistanceFn,
  type FormatDistanceToken,
  formatDuration,
} from 'date-fns';

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

export function formatShortDurationHoursMinsOnly(duration: Duration): string {
  return formatDuration(duration, {
    format: ['hours', 'minutes'],
    delimiter: '',
    locale: { formatDistance: shortFormatDistance },
  });
}
