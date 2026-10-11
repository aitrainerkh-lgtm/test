// Step 3: build the HyperFrames composition from script.json + timing.json.
// Every Khmer string on screen comes from the Gemini script. Timing comes from the
// measured narration, so each visual beat lands on its narration segment.
//
// Usage: node build/build-composition.mjs [--script f] [--timing f] [--audio f] [--out f]
import fs from 'node:fs';
import path from 'node:path';
import { p, readJson } from '../gemini/lib.mjs';
import { khmerLength } from '../gemini/plan.mjs';
import { topItems } from '../gemini/schema.mjs';
import { makeSfx } from './make-sfx.mjs';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const script = readJson(arg('script', p('script', 'script.json')));
const timing = readJson(arg('timing', p('script', 'timing.json')));
const audioSrc = arg('audio', 'assets/narration.wav');
const outFile = arg('out', p('index.html'));

// ---------- assets: fonts, GSAP ----------
const nm = (...x) => p('node_modules', ...x);
const copies = {
  'assets/vendor/gsap.min.js': nm('gsap', 'dist', 'gsap.min.js'),
  'assets/fonts/battambang-khmer-400.woff2': nm('@fontsource', 'battambang', 'files', 'battambang-khmer-400-normal.woff2'),
  'assets/fonts/battambang-khmer-700.woff2': nm('@fontsource', 'battambang', 'files', 'battambang-khmer-700-normal.woff2'),
  'assets/fonts/battambang-latin-400.woff2': nm('@fontsource', 'battambang', 'files', 'battambang-latin-400-normal.woff2'),
  'assets/fonts/battambang-latin-700.woff2': nm('@fontsource', 'battambang', 'files', 'battambang-latin-700-normal.woff2'),
  'assets/fonts/moul-khmer-400.woff2': nm('@fontsource', 'moul', 'files', 'moul-khmer-400-normal.woff2'),
  'assets/fonts/moul-latin-400.woff2': nm('@fontsource', 'moul', 'files', 'moul-latin-400-normal.woff2'),
  'assets/fonts/inter-latin-600.woff2': nm('@fontsource', 'inter', 'files', 'inter-latin-600-normal.woff2'),
  'assets/fonts/inter-latin-800.woff2': nm('@fontsource', 'inter', 'files', 'inter-latin-800-normal.woff2'),
};
for (const [to, from] of Object.entries(copies)) {
  fs.mkdirSync(path.dirname(p(to)), { recursive: true });
  fs.copyFileSync(from, p(to));
}

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r3 = (x) => Math.round(x * 1000) / 1000;
const J = JSON.stringify;
function icon(name, cls = 'ic') {
  const svg = fs.readFileSync(nm('lucide-static', 'icons', `${name}.svg`), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/class="[^"]*"/, `class="${cls}" aria-hidden="true"`)
    .replace(/stroke-width="2"/, 'stroke-width="1.8"')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
  return svg;
}
// Seeded PRNG so "random" placement is identical on every render.
let seed = 8020;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const scenes = Object.fromEntries(timing.scenes.map((s) => [s.id, s]));
const seg = (id, role) => scenes[id].segments.find((x) => x.role === role);
const T = []; // timeline code
const fromTo = (sel, from, to, at) => T.push(`tl.fromTo(${J(sel)},${J(from)},${J(to)},${r3(at)});`);
const to = (sel, vars, at) => T.push(`tl.to(${J(sel)},${J(vars)},${r3(at)});`);
const pop = (sel, at, extra = {}) => fromTo(sel, { opacity: 0, y: 26, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', ...extra }, at);

// Sound effects: synthesized files placed as timed <audio> clips under the voice.
const SFX = makeSfx();
const sfxEls = [];
// Each effect type gets two Studio lanes (alternating), so layered cues never share a lane.
const SFX_LANE = { whoosh: 10, pop: 12, tick: 14, chime: 16, outro: 18 };
const sfxCount = {};
const sfx = (name, at, vol) => {
  const f = SFX[name];
  const lane = SFX_LANE[name] + ((sfxCount[name] = (sfxCount[name] || 0) + 1) % 2);
  sfxEls.push(`<audio id="sfx-${sfxEls.length}" src="${f.src}" data-start="${r3(Math.max(0, at))}" data-duration="${r3(f.duration)}" data-track-index="${lane}" data-volume="${vol}"></audio>`);
};

const ui = script.ui;
const tag = `<div class="tag">${icon('info', 'ic ic-s')}<span>${esc(script.illustrative_label)}</span></div>`;

// ---------- scene builders ----------
const html = {};

// HOOK: a flood of familiar tasks around a racing clock, then the question.
{
  const s = scenes.hook;
  const q = seg('hook', 'question');
  const pb = seg('hook', 'problem');
  const icons = ['message-circle', 'users', 'phone', 'mail', 'file-text'];
  const spots = [[30, 40], [1130, 20], [150, 260], [1110, 280], [560, 300]];
  const chips = script.hook.screen.busy_items.map((t, i) =>
    `<div class="chip hook-chip" id="hook-chip-${i}" style="left:${spots[i][0]}px;top:${spots[i][1]}px">${icon(icons[i % icons.length])}<span>${esc(t)}</span><b class="ping"></b></div>`).join('');
  html.hook = `
    <div class="hook-clock" id="hook-clock">
      <svg viewBox="0 0 200 200" class="clock-svg"><circle cx="100" cy="100" r="88" class="clock-face"/>
        ${Array.from({ length: 12 }, (_, i) => `<line x1="100" y1="20" x2="100" y2="32" transform="rotate(${i * 30} 100 100)" class="clock-tick"/>`).join('')}
        <g id="hook-hand-h"><line x1="100" y1="100" x2="100" y2="58" class="clock-hand"/></g>
        <g id="hook-hand-m"><line x1="100" y1="100" x2="100" y2="30" class="clock-hand thin"/></g>
        <circle cx="100" cy="100" r="7" class="clock-pin"/></svg>
    </div>
    ${chips}
    <h1 class="hook-q" id="hook-q">${esc(script.hook.screen.question)}</h1>`;
  pop('#hook-clock', s.start + 0.1, { duration: 0.7 });
  T.push(`tl.fromTo("#hook-hand-m",{rotation:0},{rotation:1440,svgOrigin:"100 100",duration:${r3(s.duration)},ease:"power1.in"},${r3(s.start)});`);
  T.push(`tl.fromTo("#hook-hand-h",{rotation:40},{rotation:160,svgOrigin:"100 100",duration:${r3(s.duration)},ease:"none"},${r3(s.start)});`);
  script.hook.screen.busy_items.forEach((_, i) => {
    fromTo(`#hook-chip-${i}`, { opacity: 0, scale: 0.5, y: 60, rotation: (i % 2 ? 1 : -1) * 8 }, { opacity: 1, scale: 1, y: 0, rotation: (i % 2 ? -1 : 1) * 2, duration: 0.5, ease: 'back.out(1.8)' }, s.start + 0.25 + i * 0.22);
    sfx('pop', s.start + 0.25 + i * 0.22, 0.22);
    fromTo(`#hook-chip-${i} .ping`, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, s.start + 0.55 + i * 0.22);
    to(`#hook-chip-${i}`, { x: (i % 2 ? 6 : -6), duration: 0.08, repeat: 7, yoyo: true, ease: 'none' }, pb.start + 0.1 + i * 0.12);
  });
  fromTo('#hook-q', { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, q.start - 0.15);
  to('#hook-q', { scale: 1.04, duration: pb.end - pb.start, ease: 'sine.inOut' }, pb.start);
}

// PROBLEM: busy is not progress, then 80/20, then "approximate".
{
  const sc = script.problem.screen;
  const busy = seg('problem', 'busy');
  const rule = seg('problem', 'rule');
  const approx = seg('problem', 'approx');
  const blocks = Array.from({ length: 10 }, (_, i) => `<i class="blk ${i < 2 ? 'gold' : ''}" id="pr-blk-${i}"></i>`).join('');
  html.problem = `
    <div class="pr-a" id="pr-a">
      <div class="meter"><div class="meter-k">${icon('zap')}<span>${esc(sc.busy_label)}</span></div><div class="track"><div class="fill coral" id="pr-busy" style="width:94%"></div></div></div>
      <div class="meter"><div class="meter-k">${icon('trending-up')}<span>${esc(sc.progress_label)}</span></div><div class="track"><div class="fill teal" id="pr-prog" style="width:24%"></div></div></div>
    </div>
    <div class="pr-b" id="pr-b">
      <h1 class="pr-title" id="pr-title">${esc(sc.rule_title)}</h1>
      <div class="pr-ratio" id="pr-ratio"><span class="gold-t">80</span><span class="slash">/</span><span class="teal-t">20</span><span class="approx" id="pr-approx">≈</span></div>
      <div class="pr-diagram">
        <div class="pr-col"><div class="blocks">${blocks}</div><div class="pr-lab" id="pr-few">${esc(sc.few_label)}</div></div>
        <div class="pr-arrow" id="pr-arrow">${icon('arrow-right', 'ic ic-xl')}</div>
        <div class="pr-col"><div class="result"><div class="res-fill" id="pr-res" style="width:80%"></div></div><div class="pr-lab" id="pr-most">${esc(sc.most_label)}</div></div>
      </div>
      <div class="pr-alts" id="pr-alts"><span>70/30</span><span>80/20</span><span>90/10</span></div>
      <p class="pr-note" id="pr-note">${esc(sc.approx_note)}</p>
    </div>`;
  fromTo('#pr-a', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, busy.start - 0.3);
  fromTo('#pr-busy', { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power2.out' }, busy.start);
  fromTo('#pr-prog', { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power2.out' }, busy.start + 0.5);
  to('#pr-a', { opacity: 0, y: -40, duration: 0.45, ease: 'power2.in' }, rule.start - 0.45);
  fromTo('#pr-b', { opacity: 0 }, { opacity: 1, duration: 0.3 }, rule.start - 0.1);
  pop('#pr-title', rule.start - 0.05);
  fromTo('#pr-ratio', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, rule.start + 0.25);
  sfx('pop', rule.start + 0.25, 0.3);
  sfx('tick', rule.start + 0.6, 0.2);
  sfx('pop', approx.start, 0.3);
  for (let i = 0; i < 10; i++) fromTo(`#pr-blk-${i}`, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, rule.start + 0.6 + i * 0.05);
  pop('#pr-few', rule.start + 1.3);
  fromTo('#pr-arrow', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4 }, rule.start + 1.5);
  fromTo('#pr-res', { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power2.out' }, rule.start + 1.7);
  pop('#pr-most', rule.start + 2.2);
  fromTo('#pr-approx', { opacity: 0, scale: 0, rotation: -90 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, approx.start);
  fromTo('#pr-alts', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, approx.start + 0.3);
  pop('#pr-note', approx.start + 0.6);
}

// EXAMPLES: four steps on the left, a data visual on the right.
const EX = {
  ex1: { n: 1, bizIcon: 'store', icons: ['store', 'search', 'list-checks', 'trending-up'] },
  ex2: { n: 2, bizIcon: 'package', icons: ['package', 'bar-chart-3', 'boxes', 'smile'] },
  ex3: { n: 3, bizIcon: 'message-circle', icons: ['messages-square', 'list-ordered', 'file-check', 'timer'] },
  ex4: { n: 4, bizIcon: 'monitor', icons: ['monitor', 'hand', 'layout-grid', 'crosshair'] },
};
const STEP_KEYS = ['situation', 'measure', 'action', 'benefit'];

function exampleShell(id, panel) {
  const d = script[id];
  const steps = STEP_KEYS.map((k, i) => `
      <li class="step" id="${id}-st-${k}"><i class="step-bar" id="${id}-bar-${k}"></i>
        <div class="step-ic" id="${id}-ic-${k}">${icon(EX[id].icons[i])}</div>
        <div class="step-body"><div class="step-k">${esc(ui[k])}</div><div class="step-t">${esc(d.screen[k])}</div></div></li>`).join('');
  return `
    <div class="ex">
      <div class="ex-left">
        <div class="ex-head" id="${id}-head"><div class="ex-num"><span>${esc(ui.example)}</span><b>${EX[id].n}</b></div>
          <div class="ex-biz">${icon(EX[id].bizIcon)}<span>${esc(d.screen.business)}</span></div></div>
        <h2 class="ex-title" id="${id}-title">${esc(d.screen.title)}</h2>
        <ol class="steps">${steps}</ol>
      </div>
      <div class="ex-right"><div class="panel" id="${id}-panel"><i class="panel-glow" id="${id}-glow"></i>${panel}</div></div>
    </div>`;
}

function exampleMotion(id) {
  const s = scenes[id];
  pop(`#${id}-head`, s.start + 0.15);
  pop(`#${id}-title`, s.start + 0.3);
  STEP_KEYS.forEach((k, i) => fromTo(`#${id}-st-${k}`, { opacity: 0, x: -24 }, { opacity: 0.32, x: 0, duration: 0.4, ease: 'power2.out' }, s.start + 0.45 + i * 0.08));
  fromTo(`#${id}-panel`, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, s.start + 0.35);
  STEP_KEYS.forEach((k, i) => {
    const g = seg(id, k);
    // Light the step when its narration starts, but not before its entry fade ends.
    to(`#${id}-st-${k}`, { opacity: 1, duration: 0.35 }, Math.max(g.start - 0.1, s.start + 0.86 + i * 0.08));
    sfx('tick', Math.max(g.start - 0.1, s.start + 0.86 + i * 0.08), 0.2);
    fromTo(`#${id}-bar-${k}`, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: 'power2.out' }, g.start - 0.1);
    fromTo(`#${id}-ic-${k}`, { scale: 1 }, { scale: 1.15, duration: 0.25, yoyo: true, repeat: 1, ease: 'power1.inOut' }, g.start - 0.1);
    if (i < 3) to(`#${id}-st-${k}`, { opacity: 0.62, duration: 0.35 }, seg(id, STEP_KEYS[i + 1]).start - 0.1);
  });
  const b = seg(id, 'benefit');
  fromTo(`#${id}-glow`, { opacity: 0 }, { opacity: 1, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, b.start);
}

// Example 1: horizontal bars of each activity's share of one clear result.
{
  const c = script.ex1.chart;
  const items = [...c.items].sort((a, b) => b.value - a.value);
  const top = new Set(topItems(c));
  const max = items[0].value;
  const topSum = topItems(c).reduce((a, x) => a + x.value, 0);
  const rows = items.map((it, i) => `
      <div class="hrow ${top.has(it) ? 'is-top' : ''}" id="ex1-row-${i}"><div class="hlab">${esc(it.label)}</div>
        <div class="htrack"><div class="hfill" id="ex1-f-${i}" style="width:${(it.value / max) * 100}%"><i class="hgold" id="ex1-g-${i}"></i></div></div>
        <div class="hval" id="ex1-v-${i}">${it.value}%</div></div>`).join('');
  html.ex1 = exampleShell('ex1', `
      <div class="panel-top"><div class="metric">${icon('target', 'ic ic-s')}<span>${esc(c.metric)}</span></div>${tag}</div>
      <div class="hbars">${rows}</div>
      <div class="sumchip" id="ex1-sum"><b>${c.highlight_count}</b>${icon('arrow-right', 'ic ic-s')}<b>${topSum}%</b></div>`);
  exampleMotion('ex1');
  const m = seg('ex1', 'measure');
  const a = seg('ex1', 'action');
  items.forEach((it, i) => {
    fromTo(`#ex1-f-${i}`, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.out' }, m.start + 0.2 + i * 0.12);
    fromTo(`#ex1-v-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, m.start + 0.6 + i * 0.12);
    if (top.has(it)) fromTo(`#ex1-g-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.4 }, a.start - 0.6 + i * 0.1);
    else to(`#ex1-row-${i}`, { opacity: 0.45, duration: 0.4 }, a.start - 0.6);
  });
  pop('#ex1-sum', a.start - 0.2);
  sfx('chime', a.start - 0.2, 0.3);
}

// Example 2: Pareto chart of sales share by product group, with the cumulative line.
{
  const c = script.ex2.chart;
  const items = [...c.items].sort((a, b) => b.value - a.value);
  const top = new Set(topItems(c));
  const W = 820;
  const H = 400;
  const slot = W / items.length;
  let cum = 0;
  const pts = items.map((it, i) => {
    cum += it.value;
    return [slot * i + slot / 2, H - (cum / 100) * H, cum];
  });
  const len = pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
  const n = c.highlight_count;
  const topSum = pts[n - 1][2];
  const bars = items.map((it, i) => `<div class="pslot"><div class="pbar ${top.has(it) ? 'gold' : ''}" id="ex2-b-${i}" style="height:${(it.value / 100) * H}px"><span data-layout-allow-overflow>${it.value}%</span></div></div>`).join('');
  const labels = items.map((it) => `<div class="plab">${esc(it.label)}</div>`).join('');
  const markX = slot * n;
  html.ex2 = exampleShell('ex2', `
      <div class="panel-top"><div class="metric">${icon('bar-chart-3', 'ic ic-s')}<span>${esc(c.metric)}</span></div>${tag}</div>
      <div class="pareto" style="width:${W}px;height:${H}px">
        <div class="pgrid"></div>
        <div class="pbars">${bars}</div>
        <svg class="pline" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
          <line x1="${markX}" y1="0" x2="${markX}" y2="${H}" class="pmark" id="ex2-mark"/>
          <polyline id="ex2-line" points="${pts.map((q) => `${r3(q[0])},${r3(q[1])}`).join(' ')}" style="stroke-dasharray:${r3(len)};stroke-dashoffset:${r3(len)}"/>
          ${pts.map((q, i) => `<circle id="ex2-d-${i}" cx="${r3(q[0])}" cy="${r3(q[1])}" r="7"/>`).join('')}
        </svg>
        <div class="pcall" id="ex2-call" style="left:${markX}px;top:${pts[n - 1][1]}px"><b>${topSum}%</b></div>
      </div>
      <div class="plabs" style="width:${W}px">${labels}</div>`);
  exampleMotion('ex2');
  const m = seg('ex2', 'measure');
  const a = seg('ex2', 'action');
  items.forEach((_, i) => fromTo(`#ex2-b-${i}`, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'power2.out' }, m.start + 0.1 + i * 0.1));
  T.push(`tl.to("#ex2-line",{strokeDashoffset:0,duration:1.4,ease:"power1.inOut"},${r3(m.start + 0.9)});`);
  items.forEach((_, i) => fromTo(`#ex2-d-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.2 }, m.start + 0.9 + (1.4 * (i + 0.5)) / items.length));
  fromTo('#ex2-mark', { opacity: 0 }, { opacity: 1, duration: 0.4 }, a.start - 0.5);
  pop('#ex2-call', a.start - 0.3);
  sfx('chime', a.start - 0.3, 0.3);
}

// Example 3: the most common questions turn into approved Templates.
{
  const c = script.ex3.chart;
  const items = [...c.items].sort((a, b) => b.value - a.value);
  const top = new Set(topItems(c));
  const total = items.reduce((a, x) => a + x.value, 0);
  const topSum = topItems(c).reduce((a, x) => a + x.value, 0);
  const share = Math.round((topSum / total) * 100);
  const ROW = 78;
  const cardY = (items.length * ROW) / 2;
  const bubbles = items.map((it, i) => `
      <div class="bub ${top.has(it) ? 'is-top' : ''}" id="ex3-q-${i}" style="top:${i * ROW}px">${icon('message-circle', 'ic ic-s')}<span class="bl">${esc(it.label)}</span><b class="bc">${it.value}</b></div>`).join('');
  const links = items.map((it, i) => (top.has(it) ? `<path id="ex3-l-${i}" d="M560 ${i * ROW + 31} C 620 ${i * ROW + 31}, 600 ${cardY}, 650 ${cardY}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>` : '')).join('');
  html.ex3 = exampleShell('ex3', `
      <div class="panel-top"><div class="metric">${icon('messages-square', 'ic ic-s')}<span>${esc(c.metric)}</span></div>${tag}</div>
      <div class="qa" style="height:${items.length * ROW}px">
        ${bubbles}
        <svg class="qlinks" viewBox="0 0 820 ${items.length * ROW}" width="820" height="${items.length * ROW}">${links}</svg>
        <div class="tcard" id="ex3-card" style="top:${cardY - 90}px">${icon('file-check', 'ic ic-xl')}<div class="tname">Template</div><div class="tcheck" id="ex3-check">${icon('check', 'ic ic-s')}</div></div>
      </div>
      <div class="sumchip" id="ex3-sum"><b>${c.highlight_count}</b>${icon('arrow-right', 'ic ic-s')}<b>${share}%</b></div>`);
  exampleMotion('ex3');
  const m = seg('ex3', 'measure');
  const a = seg('ex3', 'action');
  const b = seg('ex3', 'benefit');
  items.forEach((it, i) => {
    fromTo(`#ex3-q-${i}`, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, m.start + 0.1 + i * 0.15);
    if (!top.has(it)) to(`#ex3-q-${i}`, { opacity: 0.45, duration: 0.4 }, a.start - 0.4);
  });
  pop('#ex3-sum', m.start + 1.5);
  sfx('pop', a.start - 0.3, 0.3);
  sfx('chime', b.start - 0.2, 0.3);
  fromTo('#ex3-card', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, a.start - 0.3);
  items.forEach((it, i) => {
    if (top.has(it)) T.push(`tl.to("#ex3-l-${i}",{strokeDashoffset:0,duration:0.6,ease:"power2.inOut"},${r3(a.start + 0.1 + i * 0.12)});`);
  });
  fromTo('#ex3-check', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, b.start - 0.2);
}

// Example 4: tools sorted into "within reach" and "stored away"; distractions shrink.
{
  const c = script.ex4.chart;
  const chip = (t, i, zone) => `<div class="wchip ${zone}" id="ex4-c-${zone}-${i}">${esc(t)}</div>`;
  const maxBefore = Math.max(...c.distractions.map((x) => x.before));
  const rows = c.distractions.map((x, i) => `
      <div class="drow"><div class="dlab">${icon('bell', 'ic ic-s')}<span>${esc(x.label)}</span></div>
        <div class="dtrack"><div class="dfill" id="ex4-d-${i}" style="width:${(x.before / maxBefore) * 100}%"></div></div>
        <div class="dval"><span id="ex4-b-${i}">${x.before}</span><span class="dafter" id="ex4-a-${i}">${icon('arrow-right', 'ic ic-s')}${x.after}</span></div></div>`).join('');
  html.ex4 = exampleShell('ex4', `
      <div class="panel-top"><div class="metric">${icon('layout-grid', 'ic ic-s')}</div>${tag}</div>
      <div class="zones">
        <div class="zone near" id="ex4-near"><div class="zk">${icon('hand', 'ic ic-s')}<span>${esc(c.near_label)}</span></div><div class="zchips">${c.near_items.map((t, i) => chip(t, i, 'near')).join('')}</div></div>
        <div class="zone far" id="ex4-far"><div class="zk">${icon('archive', 'ic ic-s')}<span>${esc(c.far_label)}</span></div><div class="zchips">${c.far_items.map((t, i) => chip(t, i, 'far')).join('')}</div></div>
      </div>
      <div class="dist" id="ex4-dist"><div class="dmetric">${esc(c.distraction_metric)}</div>${rows}</div>`);
  exampleMotion('ex4');
  const m = seg('ex4', 'measure');
  const a = seg('ex4', 'action');
  fromTo('#ex4-near', { opacity: 0 }, { opacity: 1, duration: 0.4 }, m.start);
  fromTo('#ex4-far', { opacity: 0 }, { opacity: 1, duration: 0.4 }, m.start + 0.1);
  [...c.near_items.map((_, i) => `near-${i}`), ...c.far_items.map((_, i) => `far-${i}`)].forEach((k, i) => {
    const dx = (rand() - 0.5) * 360;
    const dy = (rand() - 0.5) * 200;
    fromTo(`#ex4-c-${k}`, { opacity: 0, x: dx, y: dy, rotation: (rand() - 0.5) * 30 }, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.7, ease: 'power3.inOut' }, m.start + 0.4 + i * 0.12);
  });
  sfx('pop', m.start + 0.4, 0.2);
  sfx('chime', a.start + 0.2, 0.3);
  fromTo('#ex4-dist', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, m.start + 1.2);
  c.distractions.forEach((x, i) => {
    fromTo(`#ex4-d-${i}`, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, m.start + 1.4 + i * 0.15);
    to(`#ex4-d-${i}`, { scaleX: x.after / x.before, backgroundColor: '#2EC4A6', duration: 0.9, ease: 'power2.inOut' }, a.start + 0.2 + i * 0.15);
    fromTo(`#ex4-a-${i}`, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4 }, a.start + 0.4 + i * 0.15);
  });
}

// SUMMARY: the four actions, one card per narration segment.
{
  const s = scenes.summary;
  const roles = ['tasks', 'customers', 'repetitive', 'workspace'];
  const icons = ['list-checks', 'users', 'file-check', 'layout-grid'];
  const cards = script.summary.screen.actions.map((t, i) => `
      <div class="scard" id="sum-c-${i}"><div class="sic">${icon(icons[i], 'ic ic-l')}<b>${i + 1}</b></div><div class="st">${esc(t)}</div><div class="sok" id="sum-ok-${i}">${icon('check', 'ic ic-s')}</div></div>`).join('');
  html.summary = `<h1 class="sum-title" id="sum-title">${esc(script.summary.screen.title)}</h1><div class="scards">${cards}</div>`;
  pop('#sum-title', s.start + 0.15);
  roles.forEach((r, i) => {
    const g = seg('summary', r);
    fromTo(`#sum-c-${i}`, { opacity: 0, y: 50, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }, g.start - 0.25);
    sfx('pop', g.start - 0.25, 0.25);
    sfx('tick', g.end - 0.5, 0.2);
    fromTo(`#sum-ok-${i}`, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, g.end - 0.5);
  });
}

// CLOSING: the call to action, then the AI For Business end card.
{
  const sc = script.closing.screen;
  const cta = seg('closing', 'cta');
  const brand = seg('closing', 'brand');
  html.closing = `
    <div class="cl-a" id="cl-a">
      <h1 class="cl-title" id="cl-title">${esc(sc.cta_title)}</h1>
      <div class="ccards">
        <div class="ccard" id="cl-c1"><div class="cbadge">1</div>${icon('target', 'ic ic-l')}<div class="ct">${esc(sc.card_task)}</div></div>
        <div class="ccard" id="cl-c2"><div class="cbadge">1</div>${icon('layout-grid', 'ic ic-l')}<div class="ct">${esc(sc.card_workspace)}</div></div>
      </div>
      <div class="stamp" id="cl-stamp">${icon('calendar-check', 'ic ic-s')}<span>${esc(sc.today_label)}</span></div>
    </div>
    <div class="endcard" id="endcard">
      <svg class="mark" viewBox="0 0 120 120" width="190" height="190"><circle cx="60" cy="60" r="46" class="mk-bg"/>
        <circle id="mk-80" cx="60" cy="60" r="46" class="mk-80" pathLength="100" transform="rotate(-90 60 60)" style="stroke-dasharray:80 100;stroke-dashoffset:80"/>
        <circle id="mk-20" cx="60" cy="60" r="46" class="mk-20" pathLength="100" transform="rotate(198 60 60)" style="stroke-dasharray:18 100;stroke-dashoffset:18"/></svg>
      <div class="wordmark" id="wordmark">AI For Business</div>
      ${sc.brand_tagline.trim() === 'AI For Business' ? '' : `<div class="tagline" id="tagline">${esc(sc.brand_tagline)}</div>`}
    </div>`;
  pop('#cl-title', cta.start - 0.3);
  sfx('pop', cta.start + 0.4, 0.25);
  sfx('pop', cta.start + 0.9, 0.25);
  sfx('pop', cta.end - 1.2, 0.3);
  sfx('outro', brand.end - 0.15, 0.5);
  fromTo('#cl-c1', { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, cta.start + 0.4);
  fromTo('#cl-c2', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, cta.start + 0.9);
  fromTo('#cl-stamp', { opacity: 0, scale: 1.6, rotation: -14 }, { opacity: 1, scale: 1, rotation: -4, duration: 0.45, ease: 'back.out(2)' }, cta.end - 1.2);
  to('#cl-a', { opacity: 0, scale: 0.96, duration: 0.45, ease: 'power2.in' }, brand.start - 0.5);
  fromTo('#endcard', { opacity: 0 }, { opacity: 1, duration: 0.4 }, brand.start - 0.1);
  T.push(`tl.to("#mk-80",{strokeDashoffset:0,duration:0.9,ease:"power2.out"},${r3(brand.start)});`);
  T.push(`tl.to("#mk-20",{strokeDashoffset:0,duration:0.5,ease:"power2.out"},${r3(brand.start + 0.7)});`);
  fromTo('#wordmark', { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, brand.start + 0.3);
  if (sc.brand_tagline.trim() !== 'AI For Business') pop('#tagline', brand.start + 0.7);
  to('#brandbug', { opacity: 0, duration: 0.4 }, brand.start - 0.4);
}

// Scene entry and exit, and the sweep that covers each cut.
const sceneSections = timing.scenes.map((s, i) => {
  const last = i === timing.scenes.length - 1;
  fromTo(`#s-${s.id} > .scene-inner`, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }, s.start);
  if (!last) to(`#s-${s.id} > .scene-inner`, { opacity: 0, duration: 0.3, ease: 'power1.in' }, s.start + s.duration - 0.3);
  if (i > 0) sfx('whoosh', s.start - 0.35, 0.5);
  if (i > 0) fromTo('#sweep', { xPercent: -130 }, { xPercent: 130, duration: 0.7, ease: 'power2.inOut', immediateRender: i === 1 }, s.start - 0.35);
  return `<section id="s-${s.id}" class="clip scene" data-start="${r3(s.start)}" data-duration="${r3(s.duration)}" data-track-index="1"><div class="scene-inner sc-${s.id}">${html[s.id]}</div></section>`;
}).join('\n');

// ---------- subtitles: one clip per readable chunk, timed inside its segment ----------
function splitChunks(text, max = 58) {
  const parts = text.split(/(?<=[។?!៕])\s*/).map((x) => x.trim()).filter(Boolean);
  const out = [];
  const cut = (t) => {
    if (khmerLength(t) <= max) return out.push(t);
    const spaces = [...t.matchAll(/\s/g)].map((m) => m.index);
    const mid = t.length / 2;
    let at = spaces.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    if (at == null) {
      // No spaces: break before a base consonant that is not stacked under a coeng.
      at = Math.floor(mid);
      while (at < t.length - 1 && !(/[ក-អ]/.test(t[at]) && t[at - 1] !== '្')) at++;
    }
    cut(t.slice(0, at).trim());
    cut(t.slice(at).trim());
  };
  parts.forEach(cut);
  // Merge very short pieces into their neighbour.
  for (let i = out.length - 1; i > 0; i--) {
    if (khmerLength(out[i]) < 10 && khmerLength(out[i - 1]) + khmerLength(out[i]) <= max + 12) out.splice(i - 1, 2, `${out[i - 1]} ${out[i]}`);
  }
  return out;
}
let subN = 0;
const subs = [];
for (const s of timing.scenes) {
  for (const g of s.segments) {
    const pieces = splitChunks(g.text);
    const total = pieces.reduce((a, x) => a + khmerLength(x), 0);
    let at = g.start;
    pieces.forEach((piece, k) => {
      const dur = ((g.end - g.start) * khmerLength(piece)) / total;
      const end = k === pieces.length - 1 ? g.end + 0.25 : at + dur;
      const id = `sub-${subN++}`;
      subs.push(`<div id="${id}" class="clip sub" data-start="${r3(at)}" data-duration="${r3(end - at)}" data-track-index="5"><span>${esc(piece)}</span></div>`);
      fromTo(`#${id} > span`, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' }, at);
      at += dur;
    });
  }
}

// Background drift, progress line.
const TOTAL = r3(timing.total);
T.unshift(`tl.fromTo("#progress-fill",{scaleX:0},{scaleX:1,duration:${TOTAL},ease:"none"},0);`,
  `tl.fromTo("#orb-1",{x:-80,y:-40},{x:120,y:60,duration:${TOTAL},ease:"sine.inOut"},0);`,
  `tl.fromTo("#orb-2",{x:60,y:40},{x:-140,y:-50,duration:${TOTAL},ease:"sine.inOut"},0);`,
  `tl.fromTo("#brandbug",{opacity:0,y:-10},{opacity:1,y:0,duration:0.6},0.3);`);

const css = fs.readFileSync(p('build', 'styles.css'), 'utf8');
const page = `<!doctype html>
<html lang="km">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>${esc(script.title)} | AI For Business</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
      <div id="bg" class="clip layer" data-start="0" data-duration="${TOTAL}" data-track-index="0">
        <div class="grid"></div><div class="orb o1" id="orb-1"></div><div class="orb o2" id="orb-2"></div>
      </div>
${sceneSections}
      <div id="chrome" class="clip layer" data-start="0" data-duration="${TOTAL}" data-track-index="3">
        <div class="progress"><div class="progress-fill" id="progress-fill"></div></div>
        <div class="brandbug" id="brandbug" data-layout-allow-occlusion><svg viewBox="0 0 120 120" width="34" height="34"><circle cx="60" cy="60" r="46" class="mk-bg"/><circle cx="60" cy="60" r="46" class="mk-80" pathLength="100" transform="rotate(-90 60 60)" style="stroke-dasharray:80 100"/><circle cx="60" cy="60" r="46" class="mk-20" pathLength="100" transform="rotate(198 60 60)" style="stroke-dasharray:18 100"/></svg><span>AI For Business</span></div>
        <div class="sweep" id="sweep"></div>
      </div>
      ${subs.join('\n      ')}
 ${sfxEls.join('\n      ')}
      <audio id="narration" src="${audioSrc}" data-start="0" data-duration="${TOTAL}" data-track-index="9" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join('\n      ')}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(outFile, page);
console.log(`Wrote ${path.relative(p(), outFile)}: ${timing.scenes.length} scenes, ${subs.length} subtitle cues, ${TOTAL} s`);
