import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { isoOffsetHours } from "../lib/dateUtils";
import { ResponseSchema } from "../lib/types";
import type { PricePoint } from "../lib/types";

export function useOctopusPrices(product: string, tariff: string) {
  return useQuery<PricePoint[], Error, PricePoint[], [string, string, string]>({
    queryKey: ["prices", product, tariff],
    queryFn: async (
      ctx: QueryFunctionContext<[string, string, string]>
    ): Promise<PricePoint[]> => {
      const [, p, t] = ctx.queryKey;
      const period_from = isoOffsetHours(-12);
      const period_to = isoOffsetHours(36);
      const url = `https://api.octopus.energy/v1/products/${encodeURIComponent(
        p
      )}/electricity-tariffs/${encodeURIComponent(
        t
      )}/standard-unit-rates/?period_from=${encodeURIComponent(
        period_from
      )}&period_to=${encodeURIComponent(period_to)}&page_size=1500`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API returned ${res.status} ${res.statusText}`);
      }
      const json = await res.json();

      const parsed = ResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(`API response validation failed: ${parsed.error.message}`);
      }

      const results: PricePoint[] = parsed.data.results || [];
      results.sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
      return results;
    },
    refetchOnWindowFocus: false,
  });
}
