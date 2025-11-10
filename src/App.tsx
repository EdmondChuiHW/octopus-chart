import { Suspense } from 'react';
import './App.css';
import OctopusCharts from './components/OctopusCharts';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import OctopusChartsPlaceholder from './components/OctopusChartsPlaceholder';

function App() {
  return (
    <>
      <header className="app-header">
        <h1>Agile Octopus</h1>
        <p className="subtitle">Half-hourly rates (London)</p>
      </header>

      <main>
        <Suspense fallback={<OctopusChartsPlaceholder />}>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ error, resetErrorBoundary }) => (
                  <>
                    <div role="alert" className="error">
                      Error:{' '}
                      {error instanceof Error ? error.message : String(error)}
                    </div>
                    <button onClick={resetErrorBoundary}>Try again</button>
                  </>
                )}
              >
                <OctopusCharts />
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </Suspense>
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
