import { useId, useState } from 'react';
import Consumer from './Consumer';
import type { ConsumerConfig } from '../lib/types';
import type { PricePoint } from '../lib/pointUtils';
import { milliseconds } from 'date-fns';
import { millisecondsInHour } from 'date-fns/constants';

type Props = {
  relativeNow: Date | number;
  points: PricePoint[];
};

export default function ConsumerEdit({ relativeNow, points }: Props) {
  const [config, setConfig] = useState<ConsumerConfig>({
    name: '',
    duration: { hours: 6 },
    timers: [],
  });

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (isNaN(value) || value < 0.5) return;
    setConfig((prev) => ({
      ...prev,
      duration: {
        hours: value,
      },
    }));
  };
  const durationSliderId = useId();

  return (
    <div>
      <Consumer
        config={config}
        relativeNow={relativeNow}
        points={points}
        customHeader={
          <div>
            <h2>Any</h2>
            <label htmlFor={durationSliderId} style={{ display: 'block' }}>
              Duration
            </label>
            <input
              id={durationSliderId}
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={milliseconds(config.duration) / millisecondsInHour}
              onChange={handleDurationChange}
            />
          </div>
        }
      />
    </div>
  );
}
