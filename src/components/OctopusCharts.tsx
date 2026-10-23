import { useEffect, useMemo, useState } from 'react';
import { milliseconds } from 'date-fns';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import { useAgilePredict } from '../hooks/useAgilePredict';
import PriceChart from './PriceChart';
import VerticalPriceChart from './VerticalPriceChart';
import RateClock from './RateClock';
import PredictionToggle from './PredictionToggle';
import OctopusChartsLayout from './OctopusChartsLayout';
import ConsumerList from './ConsumerList';
import { buildPoints } from '../lib/pointUtils';
import { CHART_DATA, MS, TIMINGS } from '../lib/constants';
import { findLowestPeriod } from '../lib/priceUtils';
import type { ConsumerBestTime, ConsumerConfig } from '../lib/types';

const CONSUMERS: ConsumerConfig[] = [
  {
    name: 'Washer [Power Wash 60]',
    duration: { hours: 1, minutes: 0 },
    timers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hours) => ({
      mode: 'ends-in',
      duration: { hours },
    })),
  },
  {
    name: 'Washer [Cotton Eco]',
    duration: { hours: 2, minutes: 25 },
    timers: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hours) => ({
      mode: 'ends-in',
      duration: { hours },
    })),
  },
  {
    name: 'Dishwasher',
    duration: { hours: 3 },
    timers: [
      { hours: 3 },
      { hours: 3, minutes: 30 },
      { hours: 6 },
      { hours: 6, minutes: 30 },
      { hours: 9 },
      { hours: 9, minutes: 30 },
    ].map((duration) => ({ mode: 'starts-in', duration })),
  },
];

export default function OctopusCharts() {
  const [showPredictions, setShowPredictions] = useState(false);
  const { data: prices } = useOctopusPrices(
    CHART_DATA.DEFAULT_PRODUCT,
    CHART_DATA.DEFAULT_TARIFF,
  );
  const { data: forecast, isFetching: predictLoading } = useAgilePredict(
    CHART_DATA.DEFAULT_TARIFF,
    showPredictions,
  );

  const nowMs = useNowMs();
  const points = useMemo(
    () => buildPoints(prices, nowMs, showPredictions ? forecast : undefined),
    [prices, nowMs, showPredictions, forecast],
  );
  const currentIndex = points.findIndex((p) => p.status === 'active');

  // Hovering any chart highlights that half-hour on all of them; when the
  // pointer leaves, fall back to the current half-hour after a short delay.
  const [isHovering, setHovering] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const restingIndex = useDelayedIndex(currentIndex, isHovering);
  const displayIndex =
    isHovering && hoverIndex >= 0 ? hoverIndex : restingIndex;

  const consumers = useMemo<ConsumerBestTime[]>(() => {
    const upcoming = points.filter((p) => p.startMs > nowMs);
    return CONSUMERS.map((config) => {
      const length = Math.ceil(
        milliseconds(config.duration) / MS.PER_HALF_HOUR,
      );
      const index = findLowestPeriod(upcoming, (p) => p.price, length);
      return { config, bestStartMs: upcoming.at(Math.max(index, 0))?.startMs };
    });
  }, [nowMs, points]);

  const tomorrowMs = nowMs + MS.PER_DAY;
  const clock = (dateKey: number, startHourOfDay: 0 | 12) => (
    <RateClock
      dateKey={dateKey}
      startHourOfDay={startHourOfDay}
      points={points}
      displayIndex={displayIndex}
      onHover={setHoverIndex}
      setHovering={setHovering}
      consumerBestTimes={consumers}
    />
  );

  return (
    <OctopusChartsLayout
      predictionToggle={
        <PredictionToggle
          checked={showPredictions}
          onChange={setShowPredictions}
          loading={predictLoading}
        />
      }
      barChart={
        <PriceChart
          points={points}
          activeIndex={displayIndex}
          consumerBestTimes={consumers}
          onHover={setHoverIndex}
          setHovering={setHovering}
        />
      }
      verticalChart={
        <VerticalPriceChart points={points} consumerBestTimes={consumers} />
      }
      todayAmClock={clock(nowMs, 0)}
      todayPmClock={clock(nowMs, 12)}
      tomorrowAmClock={clock(tomorrowMs, 0)}
      tomorrowPmClock={clock(tomorrowMs, 12)}
      bestPeriods={
        <ConsumerList
          relativeNow={nowMs}
          consumers={CONSUMERS}
          points={points}
        />
      }
      note="Tip: slide or hover across bars to see the half-hour range and price. Tomorrow's prices may become available after 4–8 PM local time."
    />
  );
}

function useNowMs(): number {
  const [nowMs, setNowMs] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(
      () => setNowMs(Date.now()),
      TIMINGS.NOW_UPDATE_INTERVAL,
    );
    return () => clearInterval(id);
  }, []);
  return nowMs;
}

/** `index`, but -1 while hovering and only restored 500ms after hovering ends. */
function useDelayedIndex(index: number, isHovering: boolean): number {
  const [delayed, setDelayed] = useState(index);
  useEffect(() => {
    if (isHovering) {
      setDelayed(-1);
      return;
    }
    const id = setTimeout(() => setDelayed(index), 500);
    return () => clearTimeout(id);
  }, [index, isHovering]);
  return delayed;
}
