import './App.css';
import OctopusChart from './components/OctopusChart';

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Agile Octopus — Today & Tomorrow</h1>
        <p className="subtitle">
          High-contrast interactive half-hourly rates (London)
        </p>
      </header>

      <main>
        <OctopusChart />
      </main>

      <footer className="app-footer">
        <small>
          Data: Octopus Energy public price API. Times shown in Europe/London.
        </small>
      </footer>
    </div>
  );
}

export default App;
