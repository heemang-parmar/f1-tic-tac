import {
  HUMAN, CPU, emptyBoard, evaluate, cpuMove, DIFFICULTIES, POINTS,
} from './game.js';

// ---------------------------------------------------------------- config
const LIVERIES = [
  { id: 'red', name: 'Rosso', color: '#e10600' },
  { id: 'papaya', name: 'Papaya', color: '#ff8700' },
  { id: 'teal', name: 'Teal', color: '#00d2be' },
  { id: 'blue', name: 'Night blue', color: '#2f6bff' },
  { id: 'green', name: 'Racing green', color: '#00a35c' },
  { id: 'pink', name: 'Pink', color: '#ff4fa3' },
];

// Rival tyre sidewall follows the compound: hard (white), medium (yellow), soft (red).
const RIVAL_TYRE = { rookie: '#f2f2f2', pro: '#ffd400', champion: '#ff2a1f' };

const STORE_KEY = 'grid-tac-toe:v1';
const defaults = {
  livery: 'red',
  difficulty: 'pro',
  pole: 'you',
  sound: true,
  stats: { points: 0, wins: 0, draws: 0, losses: 0 },
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(defaults);
    const data = JSON.parse(raw);
    return { ...structuredClone(defaults), ...data, stats: { ...defaults.stats, ...(data.stats || {}) } };
  } catch {
    return structuredClone(defaults);
  }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
}

const prefs = load();

// ---------------------------------------------------------------- dom
const $ = (id) => document.getElementById(id);
const screens = { garage: $('garage'), race: $('race') };
const boardEl = $('board');
const statusEl = $('status');
const winlineEl = $('winline');
const winlineL = $('winline-l');

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('screen--active', k === name);
  window.scrollTo(0, 0);
}

function svgUse(id, cls) {
  return `<svg class="${cls || ''}" viewBox="0 0 100 100" aria-hidden="true"><use href="#${id}"/></svg>`;
}

// ---------------------------------------------------------------- audio + haptics
let ctx = null;
function audio() {
  if (!prefs.sound) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone({ type = 'sine', from = 440, to = from, dur = 0.15, gain = 0.15, delay = 0, filter }) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (filter) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    osc.connect(f);
    node = f;
  }
  node.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

const sfx = {
  rev: () => { tone({ type: 'sawtooth', from: 70, to: 320, dur: 0.32, gain: 0.12, filter: 900 }); tone({ type: 'square', from: 35, to: 160, dur: 0.32, gain: 0.05, filter: 500 }); },
  tyre: () => tone({ type: 'triangle', from: 1100, to: 520, dur: 0.18, gain: 0.07 }),
  light: () => tone({ type: 'sine', from: 660, dur: 0.14, gain: 0.12 }),
  go: () => tone({ type: 'sine', from: 990, dur: 0.35, gain: 0.16 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', from: f, dur: 0.22, gain: 0.14, delay: i * 0.11 })),
  lose: () => [392, 330, 262].forEach((f, i) => tone({ type: 'sawtooth', from: f, dur: 0.25, gain: 0.07, delay: i * 0.15, filter: 1200 })),
  draw: () => [523, 523].forEach((f, i) => tone({ type: 'triangle', from: f, dur: 0.18, gain: 0.12, delay: i * 0.16 })),
  tap: () => tone({ type: 'sine', from: 520, to: 600, dur: 0.06, gain: 0.06 }),
};

function buzz(pattern) {
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}

// ---------------------------------------------------------------- garage
function applyTheme() {
  const liv = LIVERIES.find((l) => l.id === prefs.livery) || LIVERIES[0];
  document.documentElement.style.setProperty('--livery', liv.color);
  document.documentElement.style.setProperty('--rival', RIVAL_TYRE[prefs.difficulty]);
}

function renderGarage() {
  $('liveries').innerHTML = LIVERIES.map((l) => `
    <button type="button" class="livery" role="radio" data-id="${l.id}" style="color:${l.color}"
      aria-checked="${l.id === prefs.livery}" aria-label="${l.name}">${svgUse('car')}</button>`).join('');

  $('rivals').innerHTML = Object.entries(DIFFICULTIES).map(([id, d]) => `
    <button type="button" class="rival" role="radio" data-id="${id}"
      style="--rc:${RIVAL_TYRE[id]};color:${RIVAL_TYRE[id]}" aria-checked="${id === prefs.difficulty}">
      ${svgUse('tyre')}
      <span class="rival__name" style="color:var(--text)">${d.label}</span>
      <span class="rival__blurb">${d.blurb}</span>
    </button>`).join('');

  for (const b of $('pole').querySelectorAll('button')) {
    b.setAttribute('aria-checked', String(b.dataset.value === prefs.pole));
  }

  const s = prefs.stats;
  $('st-points').textContent = s.points;
  $('st-wins').textContent = s.wins;
  $('st-draws').textContent = s.draws;
  $('st-losses').textContent = s.losses;
  renderSoundToggles();
  applyTheme();
}

function renderSoundToggles() {
  $('toggle-sound-g').textContent = prefs.sound ? 'Sound on' : 'Sound off';
  $('toggle-sound-g').setAttribute('aria-pressed', String(prefs.sound));
  $('toggle-sound').textContent = prefs.sound ? '🔊' : '🔇';
  $('toggle-sound').setAttribute('aria-pressed', String(prefs.sound));
  $('toggle-sound').setAttribute('aria-label', prefs.sound ? 'Sound on' : 'Sound off');
}

$('liveries').addEventListener('click', (e) => {
  const b = e.target.closest('.livery');
  if (!b) return;
  prefs.livery = b.dataset.id; save(); sfx.rev(); buzz(10); renderGarage();
});
$('rivals').addEventListener('click', (e) => {
  const b = e.target.closest('.rival');
  if (!b) return;
  prefs.difficulty = b.dataset.id; save(); sfx.tyre(); buzz(10); renderGarage();
});
$('pole').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  prefs.pole = b.dataset.value; save(); sfx.tap(); renderGarage();
});
function toggleSound() { prefs.sound = !prefs.sound; save(); renderSoundToggles(); sfx.tap(); }
$('toggle-sound-g').addEventListener('click', toggleSound);
$('toggle-sound').addEventListener('click', toggleSound);
$('reset').addEventListener('click', () => {
  if (!confirm('Reset your season points and results?')) return;
  prefs.stats = structuredClone(defaults.stats); save(); renderGarage();
});
$('how').addEventListener('click', () => openModal('help'));
$('help-close').addEventListener('click', () => closeModal('help'));

// ---------------------------------------------------------------- modals
let lastFocus = null;
function openModal(id) {
  lastFocus = document.activeElement;
  $(id).hidden = false;
  $(id).querySelector('.btn')?.focus();
}
function closeModal(id) {
  $(id).hidden = true;
  lastFocus?.focus?.();
}

// ---------------------------------------------------------------- race
const race = {
  board: emptyBoard(),
  turn: HUMAN,
  over: true,
  number: 0, // races this session (for "alternate" pole)
  you: 0,
  cpu: 0,
  token: 0, // invalidates pending CPU moves / light sequences
};

function buildBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.dataset.i = i;
    b.setAttribute('role', 'gridcell');
    boardEl.appendChild(b);
  }
}

function cellLabel(i) {
  const r = Math.floor(i / 3) + 1;
  const c = (i % 3) + 1;
  const v = race.board[i];
  return `Row ${r}, column ${c}: ${v === HUMAN ? 'your car' : v === CPU ? "rival's tyre" : 'empty'}`;
}

function renderBoard() {
  const cells = boardEl.children;
  for (let i = 0; i < 9; i++) {
    const cell = cells[i];
    const v = race.board[i];
    const want = v === HUMAN ? 'car' : v === CPU ? 'tyre' : '';
    if (cell.dataset.mark !== want) {
      cell.dataset.mark = want;
      cell.innerHTML = want ? svgUse(want, `mark-${want}`) : '';
    }
    cell.classList.toggle('is-filled', Boolean(v));
    cell.disabled = Boolean(v) || race.over || race.turn !== HUMAN;
    cell.setAttribute('aria-label', cellLabel(i));
  }
}

function renderHud() {
  $('score-you').textContent = race.you;
  $('score-cpu').textContent = race.cpu;
  $('lap').textContent = `Race ${race.number}`;
  $('hud-diff').textContent = DIFFICULTIES[prefs.difficulty].label;
  $('rival-name').textContent = DIFFICULTIES[prefs.difficulty].label;
  document.querySelector('.hud__side--you').classList.toggle('is-turn', !race.over && race.turn === HUMAN);
  document.querySelector('.hud__side--cpu').classList.toggle('is-turn', !race.over && race.turn === CPU);
}

function setStatus(text, thinking = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('is-thinking', thinking);
}

function clearWin() {
  boardEl.classList.remove('is-over');
  winlineEl.classList.remove('is-on');
  for (const c of boardEl.children) c.classList.remove('is-win');
}

function whoStarts() {
  if (prefs.pole === 'you') return HUMAN;
  if (prefs.pole === 'rival') return CPU;
  return race.number % 2 === 1 ? HUMAN : CPU;
}

function newRace({ lights = true } = {}) {
  race.token++;
  race.number++;
  race.board = emptyBoard();
  race.over = true; // locked until lights out
  race.turn = whoStarts();
  clearWin();
  renderBoard();
  renderHud();
  setStatus(race.turn === HUMAN ? 'You start from pole' : 'Rival starts from pole');
  const go = () => {
    race.over = false;
    renderBoard();
    renderHud();
    nextTurn();
  };
  if (lights) startLights(go); else go();
}

function restartRace() {
  race.number--; // same race number again
  newRace({ lights: false });
}

function nextTurn() {
  if (race.over) return;
  if (race.turn === HUMAN) {
    setStatus('Your move');
    renderBoard();
  } else {
    setStatus('Rival thinking', true);
    renderBoard();
    const token = race.token;
    const delay = 450 + Math.random() * 400;
    setTimeout(() => {
      if (token !== race.token || race.over) return;
      const m = cpuMove(race.board, prefs.difficulty);
      play(m, CPU);
    }, delay);
  }
  renderHud();
}

function play(i, who) {
  if (race.over || race.board[i]) return;
  race.board[i] = who;
  if (who === HUMAN) { sfx.rev(); buzz(15); } else { sfx.tyre(); buzz([6, 30, 6]); }
  const { winner, line } = evaluate(race.board);
  if (winner) {
    race.over = true;
    renderBoard();
    finish(winner, line);
    return;
  }
  race.turn = who === HUMAN ? CPU : HUMAN;
  renderBoard();
  nextTurn();
}

boardEl.addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell || cell.disabled) return;
  if (race.turn !== HUMAN || race.over) return;
  play(Number(cell.dataset.i), HUMAN);
});

// Arrow-key navigation for keyboard users
boardEl.addEventListener('keydown', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  const i = Number(cell.dataset.i);
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
  if (!(e.key in moves)) return;
  const j = i + moves[e.key];
  if (j < 0 || j > 8 || (Math.abs(moves[e.key]) === 1 && Math.floor(j / 3) !== Math.floor(i / 3))) return;
  e.preventDefault();
  boardEl.children[j].focus();
});

function drawWinLine(line, color) {
  const center = (i) => [(i % 3) * 100 + 50, Math.floor(i / 3) * 100 + 50];
  const [x1, y1] = center(line[0]);
  const [x2, y2] = center(line[2]);
  // extend slightly past the end cells
  const dx = (x2 - x1) * 0.18;
  const dy = (y2 - y1) * 0.18;
  winlineL.setAttribute('x1', x1 - dx);
  winlineL.setAttribute('y1', y1 - dy);
  winlineL.setAttribute('x2', x2 + dx);
  winlineL.setAttribute('y2', y2 + dy);
  winlineEl.style.setProperty('--win', color);
  boardEl.style.setProperty('--win', color);
  winlineEl.classList.remove('is-on');
  void winlineEl.getBoundingClientRect(); // restart animation
  winlineEl.classList.add('is-on');
}

function finish(winner, line) {
  renderHud();
  const s = prefs.stats;
  let outcome;
  if (winner === HUMAN) {
    race.you++; s.wins++; s.points += POINTS.win; outcome = 'win';
  } else if (winner === CPU) {
    race.cpu++; s.losses++; s.points += POINTS.loss; outcome = 'loss';
  } else {
    s.draws++; s.points += POINTS.draw; outcome = 'draw';
  }
  save();
  renderHud();

  if (line) {
    boardEl.classList.add('is-over');
    for (const i of line) boardEl.children[i].classList.add('is-win');
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue(winner === HUMAN ? '--livery' : '--rival').trim();
    drawWinLine(line, color);
  }

  const champion = prefs.difficulty === 'champion';
  const copy = {
    win: { badge: 'P1', h: 'Chequered flag!', sub: 'You took the win. Brilliant racecraft.', status: 'You win!' },
    loss: { badge: 'P2', h: 'Rival takes it', sub: 'Box, box. Regroup and go again.', status: 'Rival wins' },
    draw: {
      badge: '=',
      h: 'Photo finish',
      sub: champion ? 'A draw against the Champion is a podium-worthy drive.' : 'Dead heat. Nobody gets three in a row.',
      status: 'Photo finish',
    },
  }[outcome];
  setStatus(copy.status);

  if (outcome === 'win') { sfx.win(); buzz([30, 60, 30, 60, 80]); confetti(); }
  else if (outcome === 'loss') { sfx.lose(); buzz([120]); }
  else { sfx.draw(); buzz([40, 60, 40]); }

  const token = race.token;
  setTimeout(() => {
    if (token !== race.token) return;
    const badge = $('result-badge');
    badge.textContent = copy.badge;
    badge.className = `result__badge${outcome === 'loss' ? ' is-loss' : outcome === 'draw' ? ' is-draw' : ''}`;
    $('result-h').textContent = copy.h;
    $('result-sub').textContent = copy.sub;
    $('result-pts').textContent = `+${POINTS[outcome]} pts · Season ${s.points}`;
    openModal('result');
  }, line ? 1100 : 700);
}

// ---------------------------------------------------------------- start lights
function startLights(done) {
  const el = $('lights');
  const pods = el.querySelectorAll('.lights__pod');
  const msg = $('lights-msg');
  const token = race.token;
  const timers = [];
  let finished = false;

  pods.forEach((p) => p.classList.remove('is-on'));
  msg.textContent = 'Get ready…';
  msg.classList.remove('is-go');
  el.hidden = false;

  const end = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    el.hidden = true;
    el.removeEventListener('click', skip);
    if (token === race.token) done();
  };
  const skip = () => { sfx.go(); end(); };
  el.addEventListener('click', skip);

  const step = 380;
  pods.forEach((p, i) => {
    timers.push(setTimeout(() => { p.classList.add('is-on'); sfx.light(); buzz(8); }, 300 + i * step));
  });
  const out = 300 + pods.length * step + 300 + Math.random() * 600;
  timers.push(setTimeout(() => {
    pods.forEach((p) => p.classList.remove('is-on'));
    msg.textContent = 'Lights out!';
    msg.classList.add('is-go');
    sfx.go();
    buzz(40);
  }, out));
  timers.push(setTimeout(end, out + 650));
}

// ---------------------------------------------------------------- confetti
function confetti() {
  const box = $('confetti');
  const colors = [getComputedStyle(document.documentElement).getPropertyValue('--livery').trim(), '#ffffff', '#111111', '#ffc400'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    p.style.setProperty('--rot', `${(Math.random() - 0.5) * 1080}deg`);
    p.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    frag.appendChild(p);
  }
  box.appendChild(frag);
  setTimeout(() => { box.innerHTML = ''; }, 3800);
}

// ---------------------------------------------------------------- navigation
function enterRace() {
  race.number = 0;
  race.you = 0;
  race.cpu = 0;
  applyTheme();
  show('race');
  newRace();
}
function toGarage() {
  race.token++;
  race.over = true;
  $('lights').hidden = true;
  closeModal('result');
  renderGarage();
  show('garage');
}

$('start').addEventListener('click', () => { audio(); enterRace(); });
$('next').addEventListener('click', () => { closeModal('result'); newRace(); });
$('to-garage').addEventListener('click', toGarage);
$('back').addEventListener('click', toGarage);
$('restart').addEventListener('click', () => { closeModal('result'); restartRace(); });

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('help').hidden) closeModal('help');
});

// ---------------------------------------------------------------- boot
buildBoard();
renderGarage();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  });
}
