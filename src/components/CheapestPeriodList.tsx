import type { Period, PricePoint } from '../lib/pointUtils';
import CheapestPeriod from './CheapestPeriod';

import './CheapestPeriodList.css';
import RadioForm from './RadioForm';

export type Props = {
  points: PricePoint[];
  periods: Period[];

  legend?: React.ReactNode;
  selectedIndex?: number;
  onChange?: (index: number) => void;
};

export default function CheapestPeriodList({
  points,
  periods,
  legend,
  selectedIndex,
  onChange,
}: Props) {
  if (!periods.length) {
    return <>Cannot find the cheapest period.</>;
  }

  return (
    <RadioForm legend={legend ?? 'Period options'} initialCount={3}>
      {periods.map((period, index) => {
        return (
          <label
            key={index}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <input
              type="radio"
              name="periodChoice"
              value={index}
              checked={index === selectedIndex}
              onChange={() => onChange?.(index)}
              style={{ marginInlineEnd: '4px' }}
            />
            <CheapestPeriod points={points} period={period} />
          </label>
        );
      })}
    </RadioForm>
  );
}
