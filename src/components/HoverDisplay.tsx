import type { PricePoint } from '../lib/pointUtils';
import './HoverDisplay.css';

export default function HoverDisplay({
  title,
  point,
}: {
  title?: string;
  point: PricePoint | undefined;
}) {
  return (
    <div className="hover-display">
      {title && <span>{title} </span>}
      <span>{point?.label ?? '–'}</span>:{' '}
      <span className="rate">{point?.y.toFixed(2) ?? '–'}p/kWh</span>
    </div>
  );
}
