export function rateToColor(value: number, min: number, max: number) {
  if (isNaN(value)) return '#222';
  const t = max > min ? (value - min) / (max - min) : 0.5;
  const r1 = 46,
    g1 = 204,
    b1 = 113;
  const r2 = 231,
    g2 = 76,
    b2 = 60;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}
