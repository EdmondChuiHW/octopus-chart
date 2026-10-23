import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';

// sharp is only a transitive dependency (via @vite-pwa/assets-generator), so
// resolve it from the pnpm store rather than adding a dependency.
const pnpmDir = `${__dirname}/../../node_modules/.pnpm`;
const sharpDir = readdirSync(pnpmDir).find((d) => /^sharp@/.test(d));
const sharp = createRequire(import.meta.url)(
  `${pnpmDir}/${sharpDir}/node_modules/sharp`,
) as typeof import('sharp');
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export type Tile = {
  svg: string;
  w: number;
  h: number;
  panel?: 'am' | 'pm';
  corner?: { top: string; bottom?: string };
};
export type Block = {
  title?: string;
  subtitle?: string;
  tiles: Tile[];
  cropH?: number;
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let uid = 0;
/** Make ids unique so several chart SVGs can live in one document. */
function scope(svg: string): string {
  const p = `s${uid++}_`;
  return svg
    .replace(/<\?xml[^>]*>/, '')
    .replace(/id="([^"]+)"/g, `id="${p}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${p}$1"`);
}
function place(svg: string, x: number, y: number, w: number, h: number) {
  return scope(svg).replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    // Crop (not scale) to w×h: show the top-left w×h of the chart.
    const a = attrs.replace(/\s(x|y|width|height|viewBox)="[^"]*"/g, '');
    return `<svg${a} viewBox="0 0 ${w} ${h}" x="${x}" y="${y}" width="${w}" height="${h}" overflow="hidden">`;
  });
}

export function composePage(
  heading: string,
  blocks: Block[],
  width = 900,
): string {
  const pad = 16,
    gap = 16;
  let y = pad;
  const parts: string[] = [];
  parts.push(
    `<text x="${width / 2}" y="${y + 30}" font-size="30" font-weight="bold" fill="#fff" text-anchor="middle" font-family="DejaVu Sans">${esc(heading)}</text>`,
  );
  y += 52;
  for (const b of blocks) {
    if (b.title) {
      parts.push(
        `<rect x="0" y="${y}" width="${width}" height="40" fill="rgba(0,26,38,0.8)"/><text x="${width / 2}" y="${y + 29}" font-size="26" font-weight="bold" fill="#fff" text-anchor="middle" font-family="DejaVu Sans">${esc(b.title)}</text>`,
      );
      y += 44;
    }
    if (b.subtitle) {
      parts.push(
        `<text x="${width / 2}" y="${y + 16}" font-size="15" fill="#cfefff" text-anchor="middle" font-family="DejaVu Sans">${esc(b.subtitle)}</text>`,
      );
      y += 26;
    }
    let x = pad,
      rowH = 0;
    for (const t of b.tiles) {
      if (x + t.w > width - pad + 1 && x > pad) {
        x = pad;
        y += rowH + gap;
        rowH = 0;
      }
      const h = b.cropH ?? t.h;
      if (t.panel) {
        parts.push(
          `<rect x="${x - 8}" y="${y - 8}" width="${t.w + 16}" height="${h + 16}" rx="10" fill="${t.panel === 'am' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.02)'}"/>`,
        );
      }
      parts.push(place(t.svg, x, y, t.w, h));
      if (t.corner) {
        const c = t.panel === 'am' ? '#04202a' : 'rgba(255,255,255,0.87)';
        parts.push(
          `<text x="${x + t.w - 4}" y="${y + 18}" font-size="20" font-weight="bold" fill="${c}" text-anchor="end" font-family="DejaVu Sans">${esc(t.corner.top)}</text>`,
        );
        if (t.corner.bottom)
          parts.push(
            `<text x="${x + t.w - 4}" y="${y + h - 4}" font-size="14" font-weight="bold" fill="${c}" text-anchor="end" font-family="DejaVu Sans">${esc(t.corner.bottom)}</text>`,
          );
      }
      x += t.w + gap + (t.panel ? 16 : 0);
      rowH = Math.max(rowH, h + (t.panel ? 16 : 0));
    }
    y += rowH + gap;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}"><rect width="100%" height="100%" fill="#001a26"/>${parts.join('')}</svg>`;
}

export async function writePng(file: string, svg: string) {
  mkdirSync(dirname(file), { recursive: true });
  if (process.env.KEEP_SVG) writeFileSync(file.replace(/\.png$/, '.svg'), svg);
  await sharp(Buffer.from(svg), { density: 72 }).png().toFile(file);
}
