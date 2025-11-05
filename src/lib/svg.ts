export function buildWedgePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) {
  const sa = startAngle - Math.PI / 2;
  const ea = endAngle - Math.PI / 2;
  const x1 = cx + rOuter * Math.cos(sa);
  const y1 = cy + rOuter * Math.sin(sa);
  const x2 = cx + rOuter * Math.cos(ea);
  const y2 = cy + rOuter * Math.sin(ea);
  const x3 = cx + rInner * Math.cos(ea);
  const y3 = cy + rInner * Math.sin(ea);
  const x4 = cx + rInner * Math.cos(sa);
  const y4 = cy + rInner * Math.sin(sa);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}
