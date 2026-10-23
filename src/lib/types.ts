import type { Duration } from 'date-fns';
import * as z from 'zod/mini';

// zod/mini keeps the response validation but is ~10x smaller than classic zod,
// which matters because this module is on the critical path (main.tsx prefetch).
export const OctopusResponseSchema = z.object({
  results: z.array(
    z.object({
      value_inc_vat: z.number(),
      valid_from: z.string(),
      valid_to: z.string(),
    }),
  ),
});

export const AgileForecastResponseSchema = z.array(
  z.object({
    prices: z.array(
      z.object({
        date_time: z.string(),
        agile_pred: z.number(),
        agile_low: z.number(),
        agile_high: z.number(),
      }),
    ),
  }),
);

/** A published half-hour price (p/kWh inc VAT). Times are epoch ms. */
export type PriceSlot = { startMs: number; endMs: number; price: number };

/** A forecast half-hour price from agileforecast.co.uk (p/kWh). */
export type ForecastSlot = {
  startMs: number;
  price: number;
  low: number;
  high: number;
};

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

export type ConsumerBestTime = {
  config: ConsumerConfig;
  /** Start ms of the cheapest upcoming run, if there is one. */
  bestStartMs: number | undefined;
};
