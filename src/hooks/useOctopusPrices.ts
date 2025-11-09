import {
  useSuspenseQuery,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { ResponseSchema } from '../lib/types';
import type { ApiPricePoint } from '../lib/types';
import { addDays, subHours } from 'date-fns';

export function useOctopusPrices(product: string, tariff: string) {
  const result = useSuspenseQuery<
    ApiPricePoint[],
    Error,
    ApiPricePoint[],
    [string, string, string]
  >({
    queryKey: ['prices', product, tariff],
    queryFn: async (
      ctx: QueryFunctionContext<[string, string, string]>,
    ): Promise<ApiPricePoint[]> => {
      const [, p, t] = ctx.queryKey;
      const now = Date.now();
      const period_from = subHours(now, 1).toISOString();
      const period_to = addDays(now, 2).toISOString();
      const url = `https://api.octopus.energy/v1/products/${encodeURIComponent(
        p,
      )}/electricity-tariffs/${encodeURIComponent(
        t,
      )}/standard-unit-rates/?period_from=${encodeURIComponent(
        period_from,
      )}&period_to=${encodeURIComponent(period_to)}&page_size=1500`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API returned ${res.status} ${res.statusText}`);
      }

      const parsed = ResponseSchema.safeParse(await res.json());
      if (!parsed.success) {
        throw new Error(
          `API response validation failed: ${parsed.error.message}`,
        );
      }

      const results = parsed.data.results;
      if (results.length === 0) {
        throw new Error(
          'No price data available for the selected tariff / period.',
        );
      }

      results.sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
      return results;
    },
    refetchOnWindowFocus: false,
  });

  if (result.error && !result.isFetching) {
    throw result.error;
  }

  return result;
}
