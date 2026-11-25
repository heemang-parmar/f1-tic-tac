// Renders the PWA icons in www/icons/ from www/icons/icon.svg. Run: node scripts/render-web-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const dir = require('path').join(__dirname, '../www/icons');
const svg = fs.readFileSync(dir + '/icon.svg', 'utf8');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const jobs = [['icon-192.png',192,false],['icon-512.png',512,false],['apple-touch-icon.png',180,true],['icon-maskable-512.png',512,true]];
  for (const [name, size, full] of jobs) {
    await p.setViewportSize({ width: size, height: size });
    // full-bleed variants: square background, artwork inset to the safe zone
    const inner = full ? `<div style="width:100%;height:100%;background:#0e0e14;display:grid;place-items:center"><div style="width:${name.includes('maskable')?80:100}%;height:${name.includes('maskable')?80:100}%">${svg.replace('rx="112"','rx="0"')}</div></div>` : svg;
    await p.setContent(`<html><body style="margin:0;background:transparent">${inner}<style>svg{width:100%;height:100%;display:block}</style></body></html>`);
    await p.screenshot({ path: `${dir}/${name}`, omitBackground: !full });
  }
  await b.close();
})();
