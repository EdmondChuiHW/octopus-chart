import OctopusChartsLayout from './OctopusChartsLayout';

export default function OctopusChartsPlaceholder() {
  return (
    <>
      <OctopusChartsLayout
        barChart={null}
        todayClocks={
          <>
            <div className="rate-clock">
              <div className="chart-container"></div>
            </div>
          </>
        }
        tomorrowClocks={
          <>
            <div className="rate-clock">
              <div className="chart-container"></div>
            </div>
          </>
        }
        note={null}
      />
    </>
  );
}
