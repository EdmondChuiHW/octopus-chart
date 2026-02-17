import { useSuspenseQuery } from '@tanstack/react-query';
import type { ApiPricePoint } from '../lib/types';
import { fetchOctopusPrices } from '../lib/queries';
import { minutesToMilliseconds } from 'date-fns';

export function useOctopusPrices(product: string, tariff: string) {
  const result = useSuspenseQuery<
    ApiPricePoint[],
    Error,
    ApiPricePoint[],
    [string, string, string]
  >({
    queryKey: ['prices', product, tariff],
    queryFn: fetchOctopusPrices,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: minutesToMilliseconds(5),
    refetchIntervalInBackground: false,
    staleTime: minutesToMilliseconds(1),
  });

  if (result.error && !result.isFetching) {
    throw result.error;
  }

  return result;
}
