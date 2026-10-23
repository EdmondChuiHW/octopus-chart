import { useEffect, useRef, type HTMLAttributes } from 'react';
import { getInstanceByDom, init, type ChartOption } from '../lib/echarts';

type Props = HTMLAttributes<HTMLDivElement> & { option: ChartOption };

/**
 * Minimal ECharts binding. (echarts-for-react initialises every chart twice
 * and deep-compares options on each render; this does neither.)
 */
export default function EChart({ option, ...divProps }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = init(el, null, { renderer: 'svg' });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, []);

  // Options are merged (cheaper than rebuilding, and fewer DOM updates), so
  // every option builder must keep the same series ids / axis count and always
  // include its marker arrays. lazyUpdate coalesces pointermove bursts.
  useEffect(() => {
    const el = ref.current;
    if (el) getInstanceByDom(el)?.setOption(option, { lazyUpdate: true });
  }, [option]);

  return <div ref={ref} {...divProps} />;
}
