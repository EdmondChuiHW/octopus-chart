import type { PricePoint } from "./types";

export function incVatValue(p: PricePoint) {
  return p.value_inc_vat ?? Math.round(p.value_exc_vat * 1.05 * 100) / 100;
}

export function buildStartEndMs(points: PricePoint[]) {
  return {
    startMs: points.map((p) => p.valid_from.getTime()),
    endMs: points.map((p) => p.valid_to.getTime()),
  };
}
