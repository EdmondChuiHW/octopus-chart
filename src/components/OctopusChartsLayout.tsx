import './OctopusChartsLayout.css';

export default function OctopusChartsLayout({
  barChart,
  todayAmClock,
  todayPmClock,
  tomorrowAmClock,
  tomorrowPmClock,
  bestPeriods,
  note,
  hoverInfo,
}: {
  barChart: React.ReactNode;
  todayAmClock: React.ReactNode;
  todayPmClock: React.ReactNode;
  tomorrowAmClock: React.ReactNode;
  tomorrowPmClock: React.ReactNode;
  bestPeriods: React.ReactNode;
  note: React.ReactNode;
  hoverInfo?: React.ReactNode;
}) {
  return (
    <div className="octopus-charts-layout">
      <header className="app-header">
        <h1>Agile Octopus</h1>
        <div className="subtitle">Half-hourly rates (London)</div>
      </header>

      {hoverInfo && <div className="hover-info">{hoverInfo}</div>}

      <div className="chart-wrap">{barChart}</div>

      <h1 className="clocks-group-title">Today</h1>
      <div>
        <div className="clocks-row">
          <div className="rate-clock am">{todayAmClock}</div>
          <div className="rate-clock">{todayPmClock}</div>
        </div>
      </div>

      <h1 className="clocks-group-title">Tomorrow</h1>
      <div>
        <div className="clocks-row">
          <div className="rate-clock am">{tomorrowAmClock}</div>
          <div className="rate-clock">{tomorrowPmClock}</div>
        </div>
      </div>

      {bestPeriods && (
        <>
          <h1 id="cheapest">Cheapest periods</h1>
          <div className="best-periods">{bestPeriods}</div>
        </>
      )}

      <div className="note">{note}</div>
    </div>
  );
}
