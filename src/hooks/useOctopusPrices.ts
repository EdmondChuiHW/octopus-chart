import { useSuspenseQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';
import { fetchOctopusPrices } from '../lib/queries';
import type { PriceSlot } from '../lib/types';

export function useOctopusPrices(product: string, tariff: string) {
  const result = useSuspenseQuery<
    PriceSlot[],
    Error,
    PriceSlot[],
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
