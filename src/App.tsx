import './App.css';
import OctopusCharts from './components/OctopusCharts';

function App() {
  return (
    <>
      <header className="app-header">
        <h1>Agile Octopus — Today & Tomorrow</h1>
        <p className="subtitle">
          High-contrast interactive half-hourly rates (London)
        </p>
      </header>

      <main>
        <OctopusCharts />
      </main>

      <footer className="app-footer">
        <small>
          Data: Octopus Energy public price API. Times shown in Europe/London.
        </small>
      </footer>
    </>
  );
}

export default App;
