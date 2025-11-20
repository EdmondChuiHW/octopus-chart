import type { Duration } from 'date-fns';
import { z } from 'zod';

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

export type Timer = {
  mode: 'starts-in' | 'ends-in';
  duration: Duration;
};

export type ConsumerConfig = {
  name: string;
  duration: Duration;
  timers: Timer[];
};
