// One-shot favicon generator.
// Renders "ꓥuge" in #C9953A on a transparent/dark background,
// outputs at 32 (favicon), 180 (apple-touch), and 192/512 (replace existing).
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const FG = "#C9953A";

function wordmark(size, scale = 1) {
  // Aspect: "ꓥuge" is ~2.4× wider than tall in Inter Black.
  // We center it horizontally and scale text accordingly.
  // For square output, we render dark BG so the gold pops at tab sizes.
  const fontSize = Math.round(size * 0.46 * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#121212"/>
  <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-weight="900" font-size="${fontSize}"
    fill="${FG}" letter-spacing="-0.05em">ꓥuge</text>
</svg>`;
}

const variants = [
  // src/app/icon.png — used by Next as <link rel="icon">
  { path: "src/app/icon.png", size: 32 },
  // src/app/apple-icon.png — used by Next as <link rel="apple-touch-icon">
  { path: "src/app/apple-icon.png", size: 180 },
  // Replace the 192/512 PWA icons too — same wordmark style for coherence
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
];

for (const v of variants) {
  const buf = await sharp(Buffer.from(wordmark(v.size))).png().toBuffer();
  await writeFile(v.path, buf);
  console.log(`✓ ${v.path} (${v.size}×${v.size})`);
}
