import { useEffect, useRef, type RefObject } from 'react';
import { Chart as ChartJS } from 'chart.js';

export default function useActiveChartIndex<T extends ChartJS>(
  displayIndex: readonly [number, 'none' | 'default'],
): RefObject<T | null> {
  const [activeIndex, chartUpdateMode] = displayIndex;
  const ref = useRef<T>(null);

  useEffect(() => {
    setChartActiveIndex(ref.current, activeIndex, chartUpdateMode);
  }, [activeIndex, chartUpdateMode]);

  return ref;
}

export function setChartActiveIndex(
  chart: ChartJS | undefined | null,
  index: number,
  chartUpdateMode: 'none' | 'default' = 'default',
) {
  if (chart == null) return;

  if (index < 0) {
    chart.setActiveElements([]);
  } else {
    chart.setActiveElements([{ datasetIndex: 0, index }]);
  }
  chart.update(chartUpdateMode);
}
