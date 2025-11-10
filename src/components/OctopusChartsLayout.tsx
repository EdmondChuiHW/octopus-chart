export default function OctopusChartsLayout({
  barChart,
  todayClocks,
  tomorrowClocks,
  note,
}: {
  barChart: React.ReactNode;
  todayClocks: React.ReactNode;
  tomorrowClocks: React.ReactNode;
  note: React.ReactNode;
}) {
  return (
    <>
      <div className="chart-wrap">{barChart}</div>

      <div className="clocks-group">
        <h1 className="clocks-group-title">Today</h1>
        <div className="clocks-row">{todayClocks}</div>
      </div>
      <div className="clocks-group">
        <h1 className="clocks-group-title">Tomorrow</h1>
        <div className="clocks-row">{tomorrowClocks}</div>
      </div>

      <div className="note">{note}</div>
    </>
  );
}
