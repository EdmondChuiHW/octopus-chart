import { format } from 'date-fns';

export function formatTimeLocal(date: Date) {
  if (date.getMinutes() === 0) {
    return format(date, 'h a');
  }

  return format(date, 'h:mm a');
}
