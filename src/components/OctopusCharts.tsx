import { useEffect, useMemo, useRef, useState } from 'react';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import PriceChart from './PriceChart';
import RateClock from './RateClock';
import { buildPointsData } from '../lib/pointUtils';
import { CHART_DATA, TIMINGS } from '../lib/constants';
import { addDays, isAfter, milliseconds } from 'date-fns';
import OctopusChartsLayout from './OctopusChartsLayout';
import HoverDisplay from './HoverDisplay';
import ConsumerList from './ConsumerList';
import type { ConsumerConfig } from '../lib/types';
import { findLowestPeriod } from '../lib/priceUtils';
import { millisecondsInHour } from 'date-fns/constants';
import useResizeChartsOnOrientationChange from '../hooks/useResizeChartsOnOrientationChange';

const CONSUMERS: ConsumerConfig[] = [
  {
    name: 'Washer [Power Wash 60]',
    duration: { hours: 1, minutes: 0 },
    timers: [
      { mode: 'ends-in', duration: { hours: 2 } },
      { mode: 'ends-in', duration: { hours: 3 } },
      { mode: 'ends-in', duration: { hours: 4 } },
      { mode: 'ends-in', duration: { hours: 5 } },
      { mode: 'ends-in', duration: { hours: 6 } },
      { mode: 'ends-in', duration: { hours: 7 } },
      { mode: 'ends-in', duration: { hours: 8 } },
      { mode: 'ends-in', duration: { hours: 9 } },
      { mode: 'ends-in', duration: { hours: 10 } },
      { mode: 'ends-in', duration: { hours: 11 } },
      { mode: 'ends-in', duration: { hours: 12 } },
    ],
  },
  {
    name: 'Washer [Cotton Eco]',
    duration: { hours: 2, minutes: 25 },
    timers: [
      { mode: 'ends-in', duration: { hours: 3 } },
      { mode: 'ends-in', duration: { hours: 4 } },
      { mode: 'ends-in', duration: { hours: 5 } },
      { mode: 'ends-in', duration: { hours: 6 } },
      { mode: 'ends-in', duration: { hours: 7 } },
      { mode: 'ends-in', duration: { hours: 8 } },
      { mode: 'ends-in', duration: { hours: 9 } },
      { mode: 'ends-in', duration: { hours: 10 } },
      { mode: 'ends-in', duration: { hours: 11 } },
      { mode: 'ends-in', duration: { hours: 12 } },
    ],
  },
  {
    name: 'Dishwasher',
    duration: { hours: 3 },
    timers: [
      { mode: 'starts-in', duration: { hours: 3 } },
      { mode: 'starts-in', duration: { hours: 3, minutes: 30 } },
      { mode: 'starts-in', duration: { hours: 6 } },
      { mode: 'starts-in', duration: { hours: 6, minutes: 30 } },
      { mode: 'starts-in', duration: { hours: 9 } },
      { mode: 'starts-in', duration: { hours: 9, minutes: 30 } },
    ],
  },
];

export default function OctopusCharts() {
  const product = CHART_DATA.DEFAULT_PRODUCT;
  const tariff = CHART_DATA.DEFAULT_TARIFF;
  const { data: apiPoints } = useOctopusPrices(product, tariff);

  const nowMs = useNowMs();
  const todayKey = nowMs;
  const tomorrowKey = addDays(nowMs, 1).getTime();

  const points = useMemo(
    () => buildPointsData(apiPoints, nowMs),
    [apiPoints, nowMs],
  );
  // TODO put this in buildPointsData
  const activeIndex = points.findIndex((p) => p.status === 'active');

  // TODO check multi-touch behaviour
  const [hoverSource, setHoverSource] = useState<
    | 'today-am'
    | 'today-pm'
    | 'tomorrow-am'
    | 'tomorrow-pm'
    | 'chart'
    | undefined
  >();
  const [rawHoverIndex, setHoverIndex] = useState<number>(-1);
  const hoverIndex = hoverSource != null ? rawHoverIndex : -1;
  const delayedActiveIndex = useDelayedActiveIndex(
    activeIndex,
    hoverSource != null,
  );

  const displayIndex = useMemo(
    () =>
      hoverIndex > 0
        ? ([hoverIndex, 'none'] as const)
        : ([delayedActiveIndex, 'default'] as const),
    [hoverIndex, delayedActiveIndex],
  );
  const displayPoint = useMemo(
    () => (displayIndex[0] < 0 ? undefined : points.at(displayIndex[0])),
    [points, displayIndex],
  );

  const consumers = useMemo(
    () =>
      CONSUMERS.map((config) => {
        const afterNow = points.filter((p) => isAfter(p.startMs, nowMs));
        const targetLength = Math.ceil(
          milliseconds(config.duration) / millisecondsInHour / 0.5, // half-hourly points
        );
        const index = findLowestPeriod(afterNow, (p) => p.y, targetLength);
        return {
          config,
          bestStartTimePoints: afterNow.slice(index, index + targetLength),
        };
      }),
    [nowMs, points],
  );

  useResizeChartsOnOrientationChange();

  return (
    <>
      <OctopusChartsLayout
        barChart={
          <PriceChart
            points={points}
            displayIndex={displayIndex}
            consumerBestTimes={consumers}
            onHover={setHoverIndex}
            setHovering={(h) => setHoverSource(h ? 'chart' : undefined)}
          />
        }
        todayAmClock={
          <RateClock
            dateKey={todayKey}
            startHourOfDay={0}
            points={points}
            displayIndex={displayIndex}
            onHover={setHoverIndex}
            setHovering={(h) => setHoverSource(h ? 'today-am' : undefined)}
          />
        }
        todayPmClock={
          <RateClock
            dateKey={todayKey}
            startHourOfDay={12}
            points={points}
            displayIndex={displayIndex}
            onHover={setHoverIndex}
            setHovering={(h) => setHoverSource(h ? 'today-pm' : undefined)}
          />
        }
        tomorrowAmClock={
          <RateClock
            dateKey={tomorrowKey}
            startHourOfDay={0}
            points={points}
            displayIndex={displayIndex}
            onHover={setHoverIndex}
            setHovering={(h) => setHoverSource(h ? 'tomorrow-am' : undefined)}
          />
        }
        tomorrowPmClock={
          <RateClock
            dateKey={tomorrowKey}
            startHourOfDay={12}
            points={points}
            displayIndex={displayIndex}
            onHover={setHoverIndex}
            setHovering={(h) => setHoverSource(h ? 'tomorrow-pm' : undefined)}
          />
        }
        bestPeriods={
          <ConsumerList
            relativeNow={nowMs}
            consumers={consumers}
            points={points}
          />
        }
        note="Tip: slide or hover across bars to see the half-hour range and price. Tomorrow's prices may become available after 4–8 PM local time."
        hoverInfo={<HoverDisplay point={displayPoint} />}
      />
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

function useDelayedActiveIndex(
  activeIndex: number,
  isHovering: boolean,
): number {
  const [delayedActiveIndex, setDelayedActiveIndex] =
    useState<number>(activeIndex);
  const resetActiveIndexTimerRef = useRef<number>(0);

  useEffect(() => {
    if (isHovering) {
      setDelayedActiveIndex(-1);
      return;
    }

    resetActiveIndexTimerRef.current = setTimeout(() => {
      setDelayedActiveIndex(activeIndex);
    }, 500);

    return () => {
      clearTimeout(resetActiveIndexTimerRef.current);
      resetActiveIndexTimerRef.current = 0;
    };
  }, [activeIndex, isHovering]);

  return delayedActiveIndex;
}
