import { type QueryFunctionContext } from '@tanstack/react-query';
import { z } from 'zod';
import { ResponseSchema, AgilePredictForecastSchema } from '../lib/types';
import type { ApiPricePoint, AgilePredictPrice } from '../lib/types';
import { addDays, sub } from 'date-fns';
import { CHART_DATA } from './constants';

export async function fetchOctopusPrices(
  ctx: QueryFunctionContext<[string, string, string]>,
): Promise<ApiPricePoint[]> {
  const [, p, t] = ctx.queryKey;
  const now = Date.now();
  const period_from = sub(
    now,
    CHART_DATA.DEFAULT_LOOKBACK_DURATION,
  ).toISOString();
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
    throw new Error(`API response validation failed: ${parsed.error.message}`);
  }

  const results = parsed.data.results;
  if (results.length === 0) {
    throw new Error(
      'No price data available for the selected tariff / period.',
    );
  }

  results.sort((a, b) => a.valid_from.getTime() - b.valid_from.getTime());
  return results;
}

export async function fetchAgilePredict(
  ctx: QueryFunctionContext<[string, string]>,
): Promise<AgilePredictPrice[]> {
  const [, tariff] = ctx.queryKey;
  const region = tariff.split('-').pop() ?? '';
  const url = `https://agileforecast.co.uk/api/${encodeURIComponent(region)}?hours=72`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Agile Forecast API returned ${res.status} ${res.statusText}`);
  }

  const prices = z
    .array(AgilePredictForecastSchema)
    .safeParse(await res.json());
  if (!prices.success) {
    throw new Error(`Agile Forecast response validation failed: ${prices.error.message}`);
  }

  return prices.data[0]?.prices ?? [];
}
