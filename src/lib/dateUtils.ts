import { format, getMinutes } from 'date-fns';

export function formatTimeLocal(date: Date | number): string {
  if (getMinutes(date) === 0) {
    return format(date, 'h a');
  }

  return format(date, 'h:mm a');
}
