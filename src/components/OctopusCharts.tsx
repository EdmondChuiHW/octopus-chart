import { useEffect, useMemo, useRef, useState } from 'react';
import { useOctopusPrices } from '../hooks/useOctopusPrices';
import PriceChart from './PriceChart';
import RateClock from './RateClock';
import { buildPointsData } from '../lib/pointUtils';
import { CHART_DATA, TIMINGS } from '../lib/constants';
import { addDays } from 'date-fns';
import OctopusChartsLayout from './OctopusChartsLayout';
import HoverDisplay from './HoverDisplay';

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
    'today-am' | 'today-pm' | 'tomorrow-am' | 'tomorrow-pm' | undefined
  >();
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
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

  const hoverTitle = useMemo(() => {
    if (!hoverSource) {
      return 'Now';
    }

    switch (hoverSource) {
      case 'today-am':
      case 'today-pm':
        return 'Today';
      case 'tomorrow-am':
      case 'tomorrow-pm':
        return 'Tomorrow';
      default:
        throw new Error(`Unknown hover source: ${hoverSource satisfies never}`);
    }
  }, [hoverSource]);

  return (
    <OctopusChartsLayout
      barChart={<PriceChart points={points} />}
      todayAmClock={
        <RateClock
          dateKey={todayKey}
          startHourOfDay={0}
          points={points}
          displayIndex={displayIndex}
          onHover={(index) => setHoverIndex(index)}
          setHovering={(h) => setHoverSource(h ? 'today-am' : undefined)}
        />
      }
      todayPmClock={
        <RateClock
          dateKey={todayKey}
          startHourOfDay={12}
          points={points}
          displayIndex={displayIndex}
          onHover={(index) => setHoverIndex(index)}
          setHovering={(h) => setHoverSource(h ? 'today-pm' : undefined)}
        />
      }
      tomorrowAmClock={
        <RateClock
          dateKey={tomorrowKey}
          startHourOfDay={0}
          points={points}
          displayIndex={displayIndex}
          onHover={(index) => setHoverIndex(index)}
          setHovering={(h) => setHoverSource(h ? 'tomorrow-am' : undefined)}
        />
      }
      tomorrowPmClock={
        <RateClock
          dateKey={tomorrowKey}
          startHourOfDay={12}
          points={points}
          displayIndex={displayIndex}
          onHover={(index) => setHoverIndex(index)}
          setHovering={(h) => setHoverSource(h ? 'tomorrow-pm' : undefined)}
        />
      }
      note="Tip: slide or hover across bars to see the half-hour range and price. Tomorrow's prices may become available after 4–8 PM local time."
      hoverInfo={<HoverDisplay point={displayPoint} title={hoverTitle} />}
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
