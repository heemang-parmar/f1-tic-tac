// Generates App Store / Play Store screenshots and the Play feature graphic.
// Usage: serve www/ on :5173 (npm start), then: node scripts/store-screenshots.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.APP_URL || 'http://localhost:5173/';
const root = path.join(__dirname, '..');
const OUT = path.join(root, 'store');
const raw = path.join(OUT, '.raw');
fs.mkdirSync(raw, { recursive: true });

const fontCss = ['400', '700', '900'].map((w) => `@font-face{font-family:T;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(root, `www/fonts/titillium-web-${w}.woff2`)).toString('base64')})}`).join('');

const SHOTS = [
  { key: '1-garage', caption: 'Pick your car.<br><em>Choose your rival.</em>' },
  { key: '2-lights', caption: 'Five red lights…<br><em>then go!</em>' },
  { key: '3-race', caption: 'Your car vs<br><em>their tyres</em>' },
  { key: '4-win', caption: 'Three in a row<br><em>takes the flag</em>' },
  { key: '5-result', caption: 'Score points<br><em>all season long</em>' },
];

// Target store sizes. Raw app captures use a phone viewport; the frame scales them.
const TARGETS = [
  { dir: 'ios-6.9', w: 1320, h: 2868, vp: { width: 440, height: 956 }, dpr: 3 },
  { dir: 'android-phone', w: 1080, h: 1920, vp: { width: 412, height: 915 }, dpr: 2.625 },
];

async function captureRaw(browser, t) {
  const ctx = await browser.newContext({ viewport: t.vp, deviceScaleFactor: t.dpr, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('grid-tac-toe:v1', JSON.stringify({
        livery: 'papaya', difficulty: 'pro', pole: 'you', sound: false,
        stats: { points: 210, wins: 7, draws: 3, losses: 4 },
      }));
    } catch {}
  });
  const p = await ctx.newPage();
  const shot = (k) => p.screenshot({ path: path.join(raw, `${t.dir}-${k}.png`) });
  await p.goto(URL);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  await shot('1-garage');

  // Deterministic rival: with random() fixed high, the rival plays the last free square.
  await p.evaluate(() => { Math.random = () => 0.99; });
  await p.tap('#start');
  await p.waitForFunction(() => document.querySelectorAll('.lights__pod.is-on').length === 5, null, { timeout: 5000 });
  await p.waitForTimeout(150);
  await shot('2-lights');
  await p.waitForSelector('#lights', { state: 'hidden', timeout: 6000 });

  const tapCell = async (i) => {
    await p.waitForSelector(`.cell[data-i="${i}"]:not(:disabled)`, { timeout: 5000 });
    await p.tap(`.cell[data-i="${i}"]`);
  };
  // With random() fixed at 0.99 the Pro rival skips blocking and takes the last free corner:
  // you 4 → rival 8, you 1 → rival 6, you 7 wins down the middle column.
  await tapCell(4); await p.waitForTimeout(1300);
  await tapCell(1); await p.waitForTimeout(1300);
  await shot('3-race');
  await tapCell(7);
  await p.waitForTimeout(900);
  await shot('4-win');
  await p.waitForSelector('#result:not([hidden])', { timeout: 5000 });
  await p.waitForTimeout(500);
  await shot('5-result');
  await ctx.close();
}

async function frame(browser, t) {
  const dir = path.join(OUT, t.dir);
  fs.mkdirSync(dir, { recursive: true });
  const p = await browser.newPage({ viewport: { width: t.w, height: t.h } });
  for (const s of SHOTS) {
    const img = fs.readFileSync(path.join(raw, `${t.dir}-${s.key}.png`)).toString('base64');
    await p.setContent(`<html><head><style>${fontCss}
      html,body{margin:0;width:${t.w}px;height:${t.h}px;overflow:hidden}
      body{background:radial-gradient(120% 55% at 50% 0%,#5a0b08,#0e0e14 70%);font-family:T,sans-serif;color:#fff;
        display:flex;flex-direction:column;align-items:center}
      .kerb{width:100%;height:${t.w * 0.022}px;background:repeating-linear-gradient(90deg,#e10600 0 ${t.w * 0.05}px,#fff ${t.w * 0.05}px ${t.w * 0.1}px)}
      h1{margin:${t.h * 0.035}px 0 ${t.h * 0.03}px;font-weight:900;font-style:italic;text-transform:uppercase;text-align:center;
        font-size:${t.w * 0.085}px;line-height:1.02;letter-spacing:-.01em}
      h1 em{color:#ff3b2f}
      .phone{flex:1;min-height:0;display:flex;align-items:flex-start}
      .phone img{height:100%;max-width:${t.w * 0.84}px;object-fit:contain;object-position:top;border-radius:${t.w * 0.06}px ${t.w * 0.06}px 0 0;
        box-shadow:0 0 0 ${t.w * 0.012}px #2a2a35,0 30px 80px rgba(0,0,0,.6)}
    </style></head><body><div class="kerb"></div><h1>${s.caption}</h1>
      <div class="phone"><img src="data:image/png;base64,${img}"></div></body></html>`);
    await p.waitForTimeout(100);
    await p.screenshot({ path: path.join(dir, `${s.key}.png`) });
  }
  await p.close();
}

async function featureGraphic(browser) {
  const p = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  const icon = fs.readFileSync(path.join(root, 'www/icons/icon.svg'), 'utf8');
  await p.setContent(`<html><head><style>${fontCss}
    body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:T,sans-serif;color:#fff;
      background:radial-gradient(90% 120% at 80% 50%,#5a0b08,#0e0e14 65%);display:flex;align-items:center;gap:56px;padding:0 70px;box-sizing:border-box}
    .k{position:absolute;left:0;right:0;height:18px;background:repeating-linear-gradient(90deg,#e10600 0 36px,#fff 36px 72px)}
    svg{width:300px;height:300px;flex:none;filter:drop-shadow(0 20px 40px rgba(0,0,0,.6))}
    h1{margin:0;font-weight:900;font-style:italic;text-transform:uppercase;font-size:92px;line-height:.95}
    h1 span{color:#ff3b2f}
    p{margin:18px 0 0;font-size:34px;color:#cfcfd8}
  </style></head><body><div class="k" style="top:0"></div><div class="k" style="bottom:0"></div>
    ${icon}<div><h1>Grid<br><span>Tac</span> Toe</h1><p>Racing-themed tic-tac-toe</p></div></body></html>`);
  await p.screenshot({ path: path.join(OUT, 'android-feature-graphic-1024x500.png') });
  await p.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const t of TARGETS) {
    await captureRaw(browser, t);
    await frame(browser, t);
    console.log('wrote store/' + t.dir);
  }
  await featureGraphic(browser);
  fs.copyFileSync(path.join(root, 'www/icons/icon-512.png'), path.join(OUT, 'android-icon-512.png'));
  fs.rmSync(raw, { recursive: true, force: true });
  console.log('done');
  await browser.close();
})();
