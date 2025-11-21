import { Chart as ChartJS } from 'chart.js';
import { each } from 'chart.js/helpers';
import { useEffect } from 'react';

export default function useResizeChartsOnOrientationChange() {
  useEffect(() => {
    const listener = () => {
      each(ChartJS.instances, function (chart) {
        if (chart.options.responsive) {
          chart.resize();
        }
      });
    };

    addEventListener('resize', listener);
    return () => removeEventListener('resize', listener);
  }, []);
}
