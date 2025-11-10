import { useEffect, useMemo, useState } from 'react';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import PriceChart from './PriceChart';
import RateClock from './RateClock';
import { buildPointsData } from '../lib/pointUtils';
import { DEFAULT_PRODUCT, DEFAULT_TARIFF, TIMINGS } from '../lib/constants';
import { addDays } from 'date-fns';
import OctopusChartsLayout from './OctopusChartsLayout';

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
    <OctopusChartsLayout
      barChart={<PriceChart points={points} />}
      todayClocks={
        <>
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
        </>
      }
      tomorrowClocks={
        <>
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
        </>
      }
      note="Tip: slide or hover across bars to see the half-hour range and price. Tomorrow's prices may become available after 4–8 PM local time."
    />
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
