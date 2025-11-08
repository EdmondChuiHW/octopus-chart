import type { ApiPricePoint } from './types';

export function buildStartEndMs(points: ApiPricePoint[]) {
  return {
    startMs: points.map((p) => p.valid_from.getTime()),
    endMs: points.map((p) => p.valid_to.getTime()),
  };
}
