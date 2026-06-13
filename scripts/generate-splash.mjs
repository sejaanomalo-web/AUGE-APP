// Gerador de splash screens (apple-touch-startup-image) do PWA AUGE.
// iOS, ao abrir um PWA standalone, mostra TELA BRANCA durante o boot a menos
// que existam startup images no tamanho exato do device. Aqui geramos o glyph
// ꓥ dourado centralizado sobre o background do manifest (#080A0D), em PORTRAIT
// (o app trava orientação), para as resoluções de iPhone mais comuns.
//
// Uso: node scripts/generate-splash.mjs
// Saída: public/splash/splash-<W>x<H>.png  +  imprime o array para o layout.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const BG = "#080A0D"; // = manifest background_color
const FG = "#C9953A"; // = cor do glyph nos ícones (icon-192/512)

// { cssW, cssH, dpr } -> pixels = cssW*dpr × cssH*dpr (portrait)
const DEVICES = [
  { cssW: 375, cssH: 667, dpr: 2 }, // iPhone SE 2/3, 8
  { cssW: 375, cssH: 812, dpr: 3 }, // X, XS, 11 Pro, 12/13 mini
  { cssW: 414, cssH: 896, dpr: 2 }, // XR, 11
  { cssW: 414, cssH: 896, dpr: 3 }, // XS Max, 11 Pro Max
  { cssW: 390, cssH: 844, dpr: 3 }, // 12, 12 Pro, 13, 13 Pro, 14
  { cssW: 428, cssH: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { cssW: 393, cssH: 852, dpr: 3 }, // 14 Pro, 15, 15 Pro, 16
  { cssW: 430, cssH: 932, dpr: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { cssW: 402, cssH: 874, dpr: 3 }, // 16 Pro
  { cssW: 440, cssH: 956, dpr: 3 }, // 16 Pro Max
];

function svg(w, h) {
  const fontSize = Math.round(Math.min(w, h) * 0.3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}"
    fill="${FG}" letter-spacing="-0.02em">ꓥ</text>
</svg>`;
}

await mkdir("public/splash", { recursive: true });

const entries = [];
for (const d of DEVICES) {
  const w = d.cssW * d.dpr;
  const h = d.cssH * d.dpr;
  const name = `splash-${w}x${h}.png`;
  const buf = await sharp(Buffer.from(svg(w, h))).png().toBuffer();
  await writeFile(`public/splash/${name}`, buf);
  entries.push({
    url: `/splash/${name}`,
    media: `(device-width: ${d.cssW}px) and (device-height: ${d.cssH}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)`,
  });
  console.log(`✓ public/splash/${name} (${w}×${h})`);
}

console.log("\n--- cole em appleWebApp.startupImage do layout ---");
console.log(JSON.stringify(entries, null, 2));
