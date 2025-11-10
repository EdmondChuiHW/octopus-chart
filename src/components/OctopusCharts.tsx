import { useEffect, useMemo, useState } from 'react';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import PriceChart from './PriceChart';
import RateClock from './RateClock';
import { buildPointsData } from '../lib/pointUtils';
import { DEFAULT_PRODUCT, DEFAULT_TARIFF, TIMINGS } from '../lib/constants';
import { addDays } from 'date-fns';

export default function OctopusCharts() {
  const product = DEFAULT_PRODUCT;
  const tariff = DEFAULT_TARIFF;
  const { data: apiPoints } = useOctopusPrices(product, tariff);

  const nowMs = useNowMs();
  const todayKey = nowMs;
  const tomorrowKey = addDays(nowMs, 1).getTime();

  const points = useMemo(
    () => buildPointsData(apiPoints, nowMs),
    [apiPoints, nowMs],
  );

  return (
    <>
      <div className="chart-wrap">{<PriceChart points={points} />}</div>

      <div className="clocks-group">
        <h1 className="clocks-group-title">Today</h1>
        <div className="clocks-row">
          <RateClock
            dateKey={todayKey}
            startHourOfDay={0}
            points={points}
            nowMs={nowMs}
          />
          <RateClock
            dateKey={todayKey}
            startHourOfDay={12}
            points={points}
            nowMs={nowMs}
          />
        </div>
      </div>
      <div className="clocks-group">
        <h1 className="clocks-group-title">Tomorrow</h1>
        <div className="clocks-row">
          <RateClock
            dateKey={tomorrowKey}
            startHourOfDay={0}
            points={points}
            nowMs={nowMs}
          />
          <RateClock
            dateKey={tomorrowKey}
            startHourOfDay={12}
            points={points}
            nowMs={nowMs}
          />
        </div>
      </div>

      <div className="note">
        Tip: slide or hover across bars to see the half-hour range and price.
        Tomorrow's day-ahead prices may become available after 16:00–20:00 local
        time.
      </div>
    </>
  );
}

function useNowMs(): number {
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(
      () => setNowMs(Date.now()),
      TIMINGS.NOW_UPDATE_INTERVAL,
    );
    return () => clearInterval(id);
  }, []);

  return nowMs;
}
