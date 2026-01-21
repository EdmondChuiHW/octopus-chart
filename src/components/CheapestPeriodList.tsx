import type { Period, PricePoint } from '../lib/pointUtils';
import CheapestPeriod from './CheapestPeriod';

import './CheapestPeriodList.css';
import { ShowMoreList } from './ShowMoreList';

export type Props = {
  points: PricePoint[];
  periods: Period[];

  selectedIndex?: number;
  onChange?: (index: number) => void;
};

export default function CheapestPeriodList({
  points,
  periods,
  selectedIndex,
  onChange,
}: Props) {
  if (!periods.length) {
    return <>Cannot find the cheapest period.</>;
  }

  return (
    <form className="period-options">
      <fieldset>
        <legend>Period options</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <ShowMoreList>
            {periods.map((period, index) => {
              return (
                <label key={index}>
                  <input
                    type="radio"
                    name="periodChoice"
                    value={index}
                    checked={index === selectedIndex}
                    onChange={() => onChange?.(index)}
                  />
                  <CheapestPeriod points={points} period={period} />
                </label>
              );
            })}
          </ShowMoreList>
        </div>
      </fieldset>
    </form>
  );
}
