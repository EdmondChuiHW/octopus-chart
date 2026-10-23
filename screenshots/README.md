# Before / after screenshots

Same deterministic data in both sets (`scripts/screenshots/fixture.ts`): Agile-like
prices from 16:00 today to 23:00 tomorrow, "now" = 17:10 Europe/London, with a
few negative-price slots tomorrow lunchtime. 900px-wide page; the "All periods"
list shows its first 405px (it scrolls in the app).

| File | State |
| --- | --- |
| `1-initial.png` | Initial load: current half-hour (5pm) highlighted everywhere |
| `2-timer-hints.png` | The three "best period" timer hint charts |
| `3-hover-bar-chart.png` | Pointer 42% across the bar chart → 5am tomorrow, synced to the clocks |
| `4-hover-clock.png` | Pointer at "7 o'clock" on tomorrow's PM clock → 7pm, with the clock hand |
| `5-predictions-hover.png` | 🔮 predictions on, hovering a predicted slot (1am) |

`before/` = the Chart.js implementation, `after/` = ECharts.

Neither set comes from a browser (none was available). Both are rendered in Node
from the real components' chart configs:

- **before**: legacy components rendered with `react-dom/server`, the configs they
  pass to `react-chartjs-2` captured, drawn by real Chart.js (+ annotation plugin)
  on a small Canvas2D→SVG shim. The hover states were driven through the legacy
  hit-testing code (`getElementsAtEventForMode`, `nearestHoverPlugin`).
- **after**: `pnpm screenshots` (`scripts/screenshots/charts.shot.tsx`) captures each
  `<EChart option>` and renders it with ECharts' own SSR, driving the hover states
  through `barIndexAtPixel` / `clockSlotAt`.

Page chrome (titles, clock panels, the clocks' corner labels) is approximated by
`scripts/screenshots/page.ts`; the HTML below the charts (period/timer pickers,
reminder buttons) isn't shown. Text is drawn in DejaVu Sans, the only font available.
