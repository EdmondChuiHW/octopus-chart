import { formatDuration, isAfter } from 'date-fns';
import type { Period, PricePoint } from '../lib/pointUtils';
import { findTopNCheapestPeriods } from '../lib/priceUtils';
import CheapestPeriod from './CheapestPeriod';
import { useMemo } from 'react';

import './CheapestPeriodList.css';
import { ShowMoreList } from './ShowMoreList';

export type Props = {
  points: PricePoint[];
  relativeNow: Date | number;

  selectedIndex?: number;
  onChoiceChange?: (index: number) => void;
};

const DIFFS_IN_HOURS = new Set([1, 1.5, 2, 2.5, 3]);

export default function CheapestPeriodList({
  points: allPoints,
  relativeNow,
  selectedIndex,
  onChoiceChange,
}: Props) {
  const periods = useMemo(() => {
    const points = allPoints.filter((p) => isAfter(p.startMs, relativeNow));
    return [...DIFFS_IN_HOURS].map((diffInHours) => {
      const targetLength = diffInHours * 2; // half-hourly points
      const formattedDuration = formatDuration(
        {
          hours: Math.floor(diffInHours),
          minutes: (diffInHours % 1) * 60,
        },
        {
          format: ['hours', 'minutes'],
        },
      );

      const indexes = findTopNCheapestPeriods(
        points,
        (p) => p.y,
        targetLength,
        Number.MAX_SAFE_INTEGER,
      );

      if (!indexes.length) {
        return <>Cannot find the cheapest period for {formattedDuration}</>;
      }

      return (
        <div style={{ marginBottom: '2em' }} key={diffInHours}>
          <h2>{formattedDuration}</h2>
          <form className="period-options">
            <fieldset>
              <legend>Period options</legend>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <ShowMoreList>
                  {indexes.map((pointsIndex) => {
                    const period: Period = {
                      index: pointsIndex,
                      length: targetLength,
                    };
                    return (
                      <label key={diffInHours + pointsIndex}>
                        <input
                          type="radio"
                          name="periodChoice"
                          value={pointsIndex}
                          checked={pointsIndex === selectedIndex}
                          onChange={() => onChoiceChange?.(pointsIndex)}
                        />
                        <CheapestPeriod points={points} period={period} />
                      </label>
                    );
                  })}
                </ShowMoreList>
              </div>
            </fieldset>
          </form>
        </div>
      );
    });
  }, [allPoints, onChoiceChange, relativeNow, selectedIndex]);
  return <>{periods}</>;
}
