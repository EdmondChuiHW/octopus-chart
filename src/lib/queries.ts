import type { QueryFunctionContext } from '@tanstack/react-query';
import { addDays, sub } from 'date-fns';
import { CHART_DATA } from './constants';
import {
  AgileForecastResponseSchema,
  OctopusResponseSchema,
  type ForecastSlot,
  type PriceSlot,
} from './types';

export async function fetchOctopusPrices(
  ctx: QueryFunctionContext<[string, string, string]>,
): Promise<PriceSlot[]> {
  const [, product, tariff] = ctx.queryKey;
  const now = Date.now();
  const params = new URLSearchParams({
    period_from: sub(now, CHART_DATA.DEFAULT_LOOKBACK_DURATION).toISOString(),
    period_to: addDays(now, 2).toISOString(),
    page_size: '1500',
  });
  const url = `https://api.octopus.energy/v1/products/${encodeURIComponent(
    product,
  )}/electricity-tariffs/${encodeURIComponent(
    tariff,
  )}/standard-unit-rates/?${params}`;

  const res = await fetch(url, { signal: ctx.signal });
  if (!res.ok) {
    throw new Error(`API returned ${res.status} ${res.statusText}`);
  }

  const parsed = OctopusResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(`API response validation failed: ${parsed.error.message}`);
  }
  if (parsed.data.results.length === 0) {
    throw new Error(
      'No price data available for the selected tariff / period.',
    );
  }

  return parsed.data.results
    .map((r) => ({
      startMs: Date.parse(r.valid_from),
      endMs: Date.parse(r.valid_to),
      price: r.value_inc_vat,
    }))
    .sort((a, b) => a.startMs - b.startMs);
}

export async function fetchAgileForecast(
  ctx: QueryFunctionContext<[string, string]>,
): Promise<ForecastSlot[]> {
  const [, tariff] = ctx.queryKey;
  const region = tariff.split('-').pop() ?? '';
  const url = `https://agileforecast.co.uk/api/${encodeURIComponent(region)}?hours=72`;

  const res = await fetch(url, { signal: ctx.signal });
  if (!res.ok) {
    throw new Error(
      `Agile Forecast API returned ${res.status} ${res.statusText}`,
    );
  }

  const parsed = AgileForecastResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(
      `Agile Forecast response validation failed: ${parsed.error.message}`,
    );
  }

  return (parsed.data[0]?.prices ?? [])
    .map((p) => ({
      startMs: Date.parse(p.date_time),
      price: p.agile_pred,
      low: p.agile_low,
      high: p.agile_high,
    }))
    .sort((a, b) => a.startMs - b.startMs);
}
