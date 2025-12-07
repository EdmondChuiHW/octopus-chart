import { useMemo } from 'react';
import type { PricePoint } from '../lib/pointUtils';
import './HoverDisplay.css';
import { formatDuration, isToday, isTomorrow, type Duration } from 'date-fns';

export default function HoverDisplay({
  point,
  bestDuration,
}: {
  point: PricePoint | undefined;
  bestDuration?: Duration;
}) {
  const title = useMemo(() => {
    if (!point) {
      return null;
    }
    if (point.status === 'active') {
      return '(Now)';
    }

    if (isToday(point.startMs)) {
      return 'Today';
    }

    if (isTomorrow(point.startMs)) {
      return 'Tomorrow';
    }

    throw new Error(`Unknown point: ${point.startMs}`);
  }, [point]);

  return (
    <div className="hover-display">
      {title && <span>{title} </span>}
      <span>{point?.label ?? '–'}</span>:{' '}
      <span className="rate">{point?.y.toFixed(2) ?? '–'}p/kWh</span>
      <BestNext duration={bestDuration} />
    </div>
  );
}

function BestNext({ duration }: { duration?: Duration }) {
  if (!duration) {
    return <div className="best-next">&nbsp;</div>;
  }

  return (
    <div className="best-next">
      Average best rate for the next {formatDuration(duration)}.
    </div>
  );
}
