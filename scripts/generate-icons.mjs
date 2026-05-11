// One-shot icon generator for the AUGE PWA.
// Generates icon-192.png, icon-512.png, badge-72.png in /public.
// Render: dark #121212 background with the ꓥ (Lisu Letter A) glyph in gold.

import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const BG = "#121212";
const FG = "#C9953A";

function svg(size, fontSize) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}"
    fill="${FG}" letter-spacing="-0.02em">ꓥ</text>
</svg>`;
}

const variants = [
  { name: "public/icon-192.png", size: 192, fontSize: 140 },
  { name: "public/icon-512.png", size: 512, fontSize: 380 },
  { name: "public/badge-72.png", size: 72, fontSize: 56 },
];

for (const v of variants) {
  const buf = await sharp(Buffer.from(svg(v.size, v.fontSize)))
    .png()
    .toBuffer();
  await writeFile(v.name, buf);
  console.log(`✓ ${v.name} (${v.size}×${v.size})`);
}
