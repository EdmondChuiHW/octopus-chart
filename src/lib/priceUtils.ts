import type { PricePoint } from './types';

export function buildStartEndMs(points: PricePoint[]) {
  return {
    startMs: points.map((p) => p.valid_from.getTime()),
    endMs: points.map((p) => p.valid_to.getTime()),
  };
}
