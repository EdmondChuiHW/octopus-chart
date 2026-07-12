import type { Duration } from 'date-fns';
import { z } from 'zod';
import type { PricePoint } from './pointUtils';

export const ApiPricePointSchema = z.object({
  value_exc_vat: z.number(),
  value_inc_vat: z.number(),
  valid_from: z.string().transform((d) => new Date(d)),
  valid_to: z.string().transform((d) => new Date(d)),
});

export type ApiPricePoint = z.infer<typeof ApiPricePointSchema>;

export const ResponseSchema = z.object({
  results: z.array(ApiPricePointSchema),
});

export const AgilePredictPriceSchema = z.object({
  date_time: z.string(),
  agile_pred: z.number(),
  agile_low: z.number(),
  agile_high: z.number(),
  is_published: z.boolean().optional(),
});

export type AgilePredictPrice = z.infer<typeof AgilePredictPriceSchema>;

export const AgilePredictForecastSchema = z.object({
  name: z.string(),
  created_at: z.string(),
  prices: z.array(AgilePredictPriceSchema),
});

export type AgilePredictForecast = z.infer<typeof AgilePredictForecastSchema>;

export type Timer = {
  mode: 'starts-in' | 'ends-in';
  duration: Duration;
};

export type TimerChoice = {
  timer: Timer;
  setTime: Date;
};

export type ConsumerConfig = {
  name: string;
  duration: Duration;
  timers: Timer[];
};

export type ConsumerBestTimes = {
  config: ConsumerConfig;
  bestStartTimePoints: PricePoint[];
};
