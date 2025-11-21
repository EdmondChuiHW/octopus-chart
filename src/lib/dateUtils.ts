import { format, getMinutes, type DateArg } from 'date-fns';

export function formatTimeLocal(date: DateArg<Date>): string {
  if (getMinutes(date) === 0) {
    return format(date, 'haaa');
  }

  return format(date, 'h:mmaaa');
}
