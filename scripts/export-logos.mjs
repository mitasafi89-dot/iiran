/**
 * Generate social-media-ready SVG logos at standard platform sizes.
 *
 * Run:  node scripts/export-logos.mjs
 *
 * Outputs to public/logos/:
 *   iiran-{platform}-{light|dark}.svg
 *
 * Platform specs (square profile pictures):
 *   telegram   512×512
 *   instagram  320×320
 *   x          400×400
 *   facebook   170×170
 *   linkedin   400×400
 *   youtube    800×800
 *   favicon    512×512  (PWA / large favicon source)
 *   og         1200×630 (Open Graph / link preview)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "logos");
mkdirSync(OUT, { recursive: true });

// Iran outline path from Natural Earth data
const iranPath =
  "M16.2,11.5 L17,11.3 L17.7,10.8 L18.3,10.8 L18.7,10.6 L19.4,10.7 L20.4,11.2 " +
  "L21.2,11.3 L22.2,12.1 L22.9,12.2 L23,13 L22.6,14.1 L22.4,14.8 L22.8,14.9 " +
  "L22.4,15.5 L22.7,16.2 L22.8,16.8 L23.5,17 L23.6,17.6 L22.7,18.4 L23.2,18.9 " +
  "L23.6,19.5 L24.4,19.9 L24.5,20.7 L24.9,20.9 L25,21.3 L23.6,21.8 L23.3,22.9 " +
  "L21.5,22.6 L20.5,22.4 L19.5,22.2 L19.1,21.1 L18.6,20.9 L17.9,21.1 L16.9,21.5 " +
  "L15.8,21.2 L14.8,20.5 L13.9,20.2 L13.3,19.4 L12.6,18.1 L12.1,18.3 L11.5,17.9 " +
  "L11.2,18.3 L10.7,17.8 L10.7,17.3 L10.4,17.3 L10.5,16.6 L10,15.9 L8.9,15.4 " +
  "L8.2,14.5 L8.4,13.8 L8.9,13.5 L8.8,12.9 L8.2,12.6 L7.6,11.5 L7.1,10.8 " +
  "L7.3,10.5 L7,9.4 L7.6,9.1 L7.8,9.5 L8.3,9.9 L8.9,10.1 L9.2,10 L10.4,9.3 " +
  "L10.7,9.3 L11,9.5 L10.7,10 L11.2,10.5 L11.5,10.4 L11.8,11.1 L12.7,11.3 " +
  "L13.3,11.8 L14.6,12 L16.1,11.7 L16.2,11.5 Z";

/**
 * Build the Globe Iran logo SVG as a standalone file.
 * @param {object} opts
 * @param {number} opts.w        - width in px
 * @param {number} opts.h        - height in px
 * @param {string} opts.bg       - background fill
 * @param {string} opts.fg       - foreground stroke/fill
 * @param {boolean} opts.withText - include "IIRan" text below the icon
 */
function buildSvg({ w, h, bg, fg, withText = false }) {
  // The icon viewBox is 32×32. We center it in the canvas with padding.
  const isWide = w / h > 1.5; // OG-style landscape
  const iconArea = Math.min(w, h);
  const iconSize = withText ? iconArea * 0.52 : iconArea * 0.7;
  const iconX = (w - iconSize) / 2;
  const iconY = withText ? iconArea * 0.1 : (h - iconSize) / 2;
  const scale = iconSize / 32;

  const textBlock = withText
    ? `<text x="${w / 2}" y="${iconY + iconSize + iconArea * 0.18}" font-family="'Inter','Helvetica Neue',Arial,sans-serif" font-size="${iconArea * 0.14}" font-weight="700" fill="${fg}" text-anchor="middle" letter-spacing="-0.02em">IIRan</text>`
    : "";

  const gridOpacity = 0.55;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
  <rect width="${w}" height="${h}" fill="${bg}" rx="${Math.round(Math.min(w, h) * 0.08)}"/>
  <g transform="translate(${iconX},${iconY}) scale(${scale})">
    <defs>
      <clipPath id="gc">
        <circle cx="16" cy="16" r="13.1"/>
      </clipPath>
    </defs>
    <circle cx="16" cy="16" r="14" stroke="${fg}" stroke-width="1.8"/>
    <g clip-path="url(#gc)" opacity="${gridOpacity}">
      <ellipse cx="16" cy="16" rx="6" ry="14" stroke="${fg}" stroke-width="0.9"/>
      <ellipse cx="16" cy="16" rx="12" ry="14" stroke="${fg}" stroke-width="0.7"/>
      <path d="M2 16h28" stroke="${fg}" stroke-width="0.7"/>
      <path d="M2 10h28" stroke="${fg}" stroke-width="0.6"/>
      <path d="M2 22h28" stroke="${fg}" stroke-width="0.6"/>
    </g>
    <path d="${iranPath}" stroke="${fg}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="${fg}" fill-opacity="0.12"/>
  </g>
  ${textBlock}
</svg>`;
}

// Brand colors (oklch converted to hex approximations)
const DARK_BG = "#0a0a0f";   // near-black
const DARK_FG = "#e8e8f0";   // near-white
const LIGHT_BG = "#ffffff";
const LIGHT_FG = "#1a1a2e";  // near-black
const PRIMARY = "#2563eb";    // brand blue

const platforms = [
  { name: "telegram",  w: 512, h: 512, withText: true },
  { name: "instagram", w: 320, h: 320, withText: true },
  { name: "x",         w: 400, h: 400, withText: true },
  { name: "facebook",  w: 170, h: 170, withText: false },
  { name: "linkedin",  w: 400, h: 400, withText: true },
  { name: "youtube",   w: 800, h: 800, withText: true },
  { name: "favicon",   w: 512, h: 512, withText: false },
  { name: "og",        w: 1200, h: 630, withText: true },
];

const themes = [
  { suffix: "light", bg: LIGHT_BG, fg: LIGHT_FG },
  { suffix: "dark",  bg: DARK_BG,  fg: DARK_FG },
  { suffix: "brand", bg: PRIMARY,  fg: "#ffffff" },
];

let count = 0;
for (const p of platforms) {
  for (const t of themes) {
    const filename = `iiran-${p.name}-${t.suffix}.svg`;
    const svg = buildSvg({ w: p.w, h: p.h, bg: t.bg, fg: t.fg, withText: p.withText });
    writeFileSync(join(OUT, filename), svg, "utf-8");
    count++;
  }
}

console.log(`Generated ${count} logo files in public/logos/`);
