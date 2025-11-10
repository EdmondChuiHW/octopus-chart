import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchOctopusPrices } from './lib/queries.ts';
import { DEFAULT_PRODUCT, DEFAULT_TARIFF } from './lib/constants.ts';

const queryClient = new QueryClient();
void queryClient.prefetchQuery({
  queryKey: ['prices', DEFAULT_PRODUCT, DEFAULT_TARIFF],
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
