import { z } from "zod";

export const PricePointSchema = z.object({
  value_exc_vat: z.number(),
  value_inc_vat: z.number(),
  valid_from: z.string().transform((d) => new Date(d)),
  valid_to: z.string().transform((d) => new Date(d)),
});

export type PricePoint = z.infer<typeof PricePointSchema>;

export const ResponseSchema = z.object({
  results: z.array(PricePointSchema).optional(),
});
