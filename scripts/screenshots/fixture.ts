// Deterministic Agile-like data used to render before/after chart screenshots.
// "Now" is 17:10 Europe/London, after tomorrow's prices have been published.
export const NOW = Date.parse('2026-10-23T16:10:00Z'); // 17:10 BST
const HALF_HOUR = 30 * 60_000;

function priceAt(localHour: number, dayOffset: number): number {
  const h = localHour;
  let base: number;
  if (h < 4.5) base = 13 - h * 0.4;
  else if (h < 7) base = 12 + (h - 4.5) * 4;
  else if (h < 10) base = 23 + Math.sin(h) * 2;
  else if (h < 16)
    base = 18 - Math.sin(((h - 10) / 6) * Math.PI) * (dayOffset ? 17 : 5);
  else if (h < 19) base = 31 + Math.sin(((h - 16) / 3) * Math.PI) * 7;
  else base = 25 - (h - 19) * 1.6;
  return Math.round((base + Math.sin(h * 7.3 + dayOffset) * 0.9) * 100) / 100;
}

/** Octopus `standard-unit-rates` response, newest first like the real API. */
export function octopusResponse() {
  const first = Date.parse('2026-10-23T15:00:00Z'); // 16:00 BST today
  const last = Date.parse('2026-10-24T22:00:00Z'); // 23:00 BST tomorrow
  const results = [];
  for (let t = first; t < last; t += HALF_HOUR) {
    const local = new Date(t);
    const dayOffset = local.getDate() === 23 ? 0 : 1;
    const v = priceAt(local.getHours() + local.getMinutes() / 60, dayOffset);
    results.push({
      value_exc_vat: Math.round((v / 1.05) * 100) / 100,
      value_inc_vat: v,
      valid_from: new Date(t).toISOString().replace('.000', ''),
      valid_to: new Date(t + HALF_HOUR).toISOString().replace('.000', ''),
      payment_method: null,
    });
  }
  return {
    count: results.length,
    next: null,
    previous: null,
    results: results.reverse(),
  };
}

/** agileforecast.co.uk response (72h from the current slot). */
export function forecastResponse() {
  const first = Date.parse('2026-10-23T16:00:00Z');
  const prices = [];
  for (let i = 0; i < 144; i++) {
    const t = first + i * HALF_HOUR;
    const local = new Date(t);
    const pred = priceAt(local.getHours() + local.getMinutes() / 60, 2) + 1.5;
    const spread = 1 + i * 0.04;
    prices.push({
      date_time: new Date(t).toISOString().replace('.000Z', '+00:00'),
      agile_pred: Math.round(pred * 100) / 100,
      agile_low: Math.round((pred - spread) * 100) / 100,
      agile_high: Math.round((pred + spread * 1.4) * 100) / 100,
    });
  }
  return [{ name: 'Region C', created_at: '2026-10-23T10:15:00Z', prices }];
}
