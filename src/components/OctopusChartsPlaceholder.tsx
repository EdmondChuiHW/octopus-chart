import HoverDisplay from './HoverDisplay';
import OctopusChartsLayout from './OctopusChartsLayout';

export default function OctopusChartsPlaceholder() {
  return (
    <>
      <OctopusChartsLayout
        hoverInfo={<HoverDisplay point={undefined} />}
        barChart={null}
        todayAmClock={<div className="chart-container"></div>}
        todayPmClock={<div className="chart-container"></div>}
        tomorrowAmClock={<div className="chart-container"></div>}
        tomorrowPmClock={<div className="chart-container"></div>}
        note={null}
      />
    </>
  );
}
