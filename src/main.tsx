import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchOctopusPrices } from './lib/queries.ts';
import { CHART_DATA } from './lib/constants.ts';
import './index.css';

const App = lazy(() => import('./App.tsx'));

const queryClient = new QueryClient();
void queryClient.prefetchQuery({
  queryKey: ['prices', CHART_DATA.DEFAULT_PRODUCT, CHART_DATA.DEFAULT_TARIFF],
  queryFn: fetchOctopusPrices,
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
