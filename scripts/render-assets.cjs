// Renders the source images that `npx capacitor-assets generate` turns into
// every native icon/splash size. Run: node scripts/render-assets.cjs
// (Requires Playwright + Chromium, which are only needed when the icon changes.)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });

const svg = fs.readFileSync(path.join(root, 'www/icons/icon.svg'), 'utf8');
const square = svg.replaceAll(' rx="112"', ''); // iOS/Android round the corners themselves
// Adaptive-icon foreground: just the grid and pieces, on transparent.
const foreground = svg
  .replace('<rect width="512" height="512" rx="112" fill="#0e0e14"/>', '')
  .replace(/<rect x="0" y="440"[^>]*\/>/, '');

const BG = '#0e0e14';
const jobs = [
  // iOS + legacy Android icon: opaque, full-bleed square (the OS rounds the corners).
  { name: 'icon-only.png', size: 1024, html: `<div class="fill">${square}</div>` },
  // Android adaptive icon: art inside the central safe zone.
  { name: 'icon-foreground.png', size: 1024, transparent: true, html: `<div class="center" style="--s:96%">${foreground}</div>` },
  { name: 'icon-background.png', size: 1024, html: `<div class="fill" style="background:${BG}"></div>` },
  { name: 'splash.png', size: 2732, html: `<div class="fill center" style="background:${BG};--s:22%">${svg}</div>` },
  { name: 'splash-dark.png', size: 2732, html: `<div class="fill center" style="background:${BG};--s:22%">${svg}</div>` },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const job of jobs) {
    await page.setViewportSize({ width: job.size, height: job.size });
    await page.setContent(`<html><head><style>
      html,body{margin:0;width:100%;height:100%;background:transparent}
      .fill{width:100%;height:100%}
      .center{width:100%;height:100%;display:grid;place-items:center}
      .center>svg{width:var(--s);height:var(--s)}
      .fill>svg{width:100%;height:100%;display:block}
    </style></head><body>${job.html}</body></html>`);
    await page.screenshot({ path: path.join(out, job.name), omitBackground: Boolean(job.transparent) });
    console.log('wrote assets/' + job.name);
  }
  await browser.close();
})();
