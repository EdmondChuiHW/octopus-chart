import { useSuspenseQuery } from '@tanstack/react-query';
import type { ApiPricePoint } from '../lib/types';
import { fetchOctopusPrices } from '../lib/queries';

export function useOctopusPrices(product: string, tariff: string) {
  const result = useSuspenseQuery<
    ApiPricePoint[],
    Error,
    ApiPricePoint[],
    [string, string, string]
  >({
    queryKey: ['prices', product, tariff],
    queryFn: fetchOctopusPrices,
    refetchOnWindowFocus: false,
  });

  if (result.error && !result.isFetching) {
    throw result.error;
  }

  return result;
}
