// "The Notebook" — Build and Deploy with AI (60s, 1920x1080, 25 fps)
// Every frame is drawn by render(t) so the video can be rendered frame by frame.

const W = 1920, H = 1080, DUR = 60;
const C = {
  or: '#E8731A', orD: '#C95E10', orL: '#FBE3CF',
  dg: '#1B7A3D', dgD: '#145C2E', fg: '#3CB54A', gL: '#E7F3EA',
  w: '#FFFFFF', ink: '#1F2A24', grey: '#7A847E', line: '#DCD3C4',
  paper: '#FFF8EE', wall: '#F3E9DA', wood: '#B67D4E', woodL: '#D39C68', woodD: '#8C5733',
  skin: '#B5764A', hair: '#241812',
};

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const p = (t, s, d) => clamp((t - s) / d);
const eo = k => 1 - Math.pow(1 - k, 3);
const ei = k => k * k * k;
const eio = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const back = (k, s = 1.3) => { const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const pop = (t, s, d = 0.2, amt = 0.08) => 1 + amt * Math.sin(Math.PI * p(t, s, d));
const bez = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };
const bezD = (a, b, c, d, u) => { const v = 1 - u; return 3 * v * v * (b - a) + 6 * v * u * (c - b) + 3 * u * u * (d - c); };
const money = v => '$' + v.toFixed(2);

// ---------- drawing helpers ----------
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fam(f) { return f === 'hand' ? 'Caveat, cursive' : f === 'km' ? 'Battambang, sans-serif' : 'Poppins, sans-serif'; }
function font(weight, size, f) { return `${weight} ${size}px ${fam(f)}`; }
function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  ctx.font = font(o.weight || 600, o.size || 40, o.fam);
  ctx.fillStyle = o.color || C.ink;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  if (o.shadow) { ctx.shadowColor = 'rgba(31,42,36,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; }
  ctx.fillText(s, x, y);
  ctx.restore();
}
function tw(ctx, s, weight, size, f) { ctx.save(); ctx.font = font(weight, size, f); const w = ctx.measureText(s).width; ctx.restore(); return w; }
function shadowed(ctx, fn, blur = 34, oy = 12, a = 0.18) {
  ctx.save();
  ctx.shadowColor = `rgba(31,42,36,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy;
  fn(); ctx.restore();
}
function card(ctx, x, y, w, h, r = 28, fill = C.w, sh = true) {
  if (sh) shadowed(ctx, () => { ctx.fillStyle = fill; rr(ctx, x, y, w, h, r); ctx.fill(); });
  else { ctx.fillStyle = fill; rr(ctx, x, y, w, h, r); ctx.fill(); }
}
function camera(ctx, cx, cy, s) { ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }

// Words slide up 24px and fade in, one after another.
function wordsUp(ctx, str, cx, y, t, t0, o = {}) {
  const size = o.size || 72, weight = o.weight || 800, stag = o.stagger || 0.16, dur = o.dur || 0.4;
  const words = str.split(' ');
  const sp = tw(ctx, ' ', weight, size);
  const ws = words.map(w => tw(ctx, w, weight, size));
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let x = o.align === 'left' ? cx : cx - total / 2;
  words.forEach((w, i) => {
    const k = eo(p(t, t0 + i * stag, dur));
    if (k > 0) txt(ctx, w, x, y + (1 - k) * 24, { size, weight, color: (o.colors && o.colors[i]) || o.color || C.ink, alpha: k * (o.alpha == null ? 1 : o.alpha), shadow: o.shadow });
    x += ws[i] + sp;
  });
}

// Top-left step label: orange "STEP n" pill + white text pill.
function stepLabel(ctx, t, t0, step, text, tOut) {
  const k = eo(p(t, t0, 0.4));
  if (k <= 0) return;
  let a = k;
  if (tOut != null) a *= 1 - p(t, tOut, 0.3);
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate((1 - k) * -40, 0);
  let x = 60;
  const y = 50, h = 66;
  if (step) {
    const s = 'STEP ' + step, w = tw(ctx, s, 700, 26) + 44;
    shadowed(ctx, () => { ctx.fillStyle = C.or; rr(ctx, x, y, w, h, 33); ctx.fill(); }, 20, 6, 0.2);
    txt(ctx, s, x + w / 2, y + 43, { size: 26, weight: 700, color: C.w, align: 'center' });
    x += w + 12;
  }
  const w2 = tw(ctx, text, 600, 34) + (step ? 48 : 76);
  shadowed(ctx, () => { ctx.fillStyle = C.w; rr(ctx, x, y, w2, h, 33); ctx.fill(); }, 20, 6, 0.2);
  if (!step) { ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(x + 32, y + h / 2, 9, 0, Math.PI * 2); ctx.fill(); }
  txt(ctx, text, x + (step ? 24 : 52), y + 45, { size: 34, weight: 600, color: C.ink });
  ctx.restore();
}

// ---------- shared environment pieces ----------
let woodCache = null;
function drawWood(ctx) {
  if (!woodCache) {
    woodCache = document.createElement('canvas'); woodCache.width = W; woodCache.height = H;
    const g = woodCache.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const y = i * 130;
      g.fillStyle = i % 2 ? '#B07548' : '#BC8453'; g.fillRect(0, y, W, 130);
      g.fillStyle = 'rgba(90,50,25,0.28)'; g.fillRect(0, y + 126, W, 4);
      g.strokeStyle = 'rgba(110,62,30,0.16)'; g.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const yy = y + 22 + k * 27 + ((i * 37 + k * 13) % 9);
        g.beginPath(); g.moveTo(0, yy);
        for (let x = 0; x <= W; x += 40) g.lineTo(x, yy + Math.sin((x + i * 140 + k * 70) / 170) * 4);
        g.stroke();
      }
    }
    const v = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1200);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,5,0.35)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  ctx.drawImage(woodCache, 0, 0);
}

function paperBg(ctx) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#ECE3D3'; ctx.lineWidth = 3;
  for (let y = 60; y < H; y += 66) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(232,115,26,0.25)';
  ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(90, H); ctx.stroke();
}

function counter(ctx, y) {
  ctx.fillStyle = C.wood; ctx.fillRect(0, y, W, H - y);
  ctx.fillStyle = C.woodL; ctx.fillRect(0, y, W, 20);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, y + 20, W, 8);
  ctx.strokeStyle = 'rgba(90,50,25,0.25)'; ctx.lineWidth = 3;
  for (let x = 80; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.lineTo(x, H); ctx.stroke(); }
}

function tuktuk(ctx, x, y, s, night) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = night ? '#0F1720' : C.ink;
  ctx.beginPath(); ctx.arc(-50, 0, 16, 0, 7); ctx.arc(60, 0, 16, 0, 7); ctx.fill();
  ctx.fillStyle = night ? '#3A2A20' : C.or; rr(ctx, -80, -60, 120, 52, 10); ctx.fill();   // cab
  ctx.fillStyle = night ? '#2A3A2E' : C.dg; rr(ctx, -90, -92, 140, 22, 8); ctx.fill();    // canopy
  ctx.fillStyle = night ? '#3A2A20' : C.orD; rr(ctx, 40, -50, 50, 40, 8); ctx.fill();     // motorbike front
  ctx.strokeStyle = night ? '#2A3A2E' : C.ink; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-85, -70); ctx.lineTo(-85, -50); ctx.moveTo(45, -70); ctx.lineTo(45, -50); ctx.stroke();
  if (night) { ctx.fillStyle = 'rgba(255,190,110,0.9)'; ctx.beginPath(); ctx.arc(90, -32, 7, 0, 7); ctx.fill(); }
  ctx.restore();
}

function windowPane(ctx, x, y, w, h, night, t) {
  ctx.save();
  rr(ctx, x, y, w, h, 14); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (night) { g.addColorStop(0, '#1A2634'); g.addColorStop(1, '#34475C'); }
  else { g.addColorStop(0, '#CFE8DA'); g.addColorStop(1, '#F5FBF7'); }
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // skyline
  const bl = [[0, 0.55, 70], [70, 0.42, 60], [130, 0.62, 80], [210, 0.48, 50], [260, 0.58, 90], [350, 0.4, 70]];
  bl.forEach(([bx, bh, bw], i) => {
    const top = y + h * bh;
    ctx.fillStyle = night ? '#121B26' : '#B7D2C2';
    ctx.fillRect(x + bx, top, bw - 6, h);
    if (night) {
      ctx.fillStyle = 'rgba(255,180,100,0.75)';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) if ((i * 7 + r * 3 + c) % 3 === 0) ctx.fillRect(x + bx + 10 + c * 22, top + 16 + r * 30, 10, 12);
    }
  });
  // street + passing tuk-tuk
  ctx.fillStyle = night ? '#0E141B' : '#9DBDAA'; ctx.fillRect(x, y + h - 40, w, 40);
  const tx = x - 200 + ((t * 120) % (w + 400));
  tuktuk(ctx, tx, y + h - 30, 0.7, night);
  ctx.restore();
  ctx.strokeStyle = C.w; ctx.lineWidth = 14; rr(ctx, x, y, w, h, 14); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
}

function clock(ctx, x, y, r, hh, mm) {
  shadowed(ctx, () => { ctx.fillStyle = C.w; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }, 16, 6, 0.15);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * r * 0.78, y - Math.cos(a) * r * 0.78); ctx.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); ctx.stroke(); }
  const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
  ctx.lineCap = 'round';
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); ctx.stroke();
  ctx.strokeStyle = C.or; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * r * 0.75, y - Math.cos(ma) * r * 0.75); ctx.stroke();
  ctx.lineCap = 'butt';
}

function menuBoard(ctx, x, y, w, h) {
  shadowed(ctx, () => { ctx.fillStyle = C.woodD; rr(ctx, x - 12, y - 12, w + 24, h + 24, 14); ctx.fill(); }, 20, 8, 0.2);
  ctx.fillStyle = C.dgD; rr(ctx, x, y, w, h, 8); ctx.fill();
  txt(ctx, 'កាហ្វេ', x + w / 2, y + 62, { fam: 'km', size: 44, weight: 700, color: C.w, align: 'center' });
  txt(ctx, 'COFFEE MENU', x + w / 2, y + 98, { size: 20, weight: 700, color: '#F7B27A', align: 'center' });
  [['Iced Latte', '$2.50'], ['Hot Coffee', '$1.50'], ['Lemon Tea', '$1.75']].forEach(([a, b], i) => {
    txt(ctx, a, x + 34, y + 148 + i * 40, { size: 26, weight: 400, color: C.w });
    txt(ctx, b, x + w - 34, y + 148 + i * 40, { size: 26, weight: 600, color: C.w, align: 'right' });
  });
}

function lamp(ctx, x, len, on) {
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
  if (on) {
    const g = ctx.createRadialGradient(x, len + 20, 10, x, len + 20, 260);
    g.addColorStop(0, 'rgba(255,196,120,0.45)'); g.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 260, len - 240, 520, 520);
  }
  ctx.fillStyle = C.or; ctx.beginPath(); ctx.ellipse(x, len + 30, 56, 36, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#FFE2B8'; ctx.beginPath(); ctx.ellipse(x, len + 30, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
}

function plant(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const leaves = [[-0.9, 120], [-0.5, 150], [-0.15, 170], [0.2, 160], [0.55, 140], [0.9, 115], [-0.3, 110], [0.35, 105]];
  leaves.forEach(([a, l], i) => {
    ctx.save(); ctx.translate(0, -70); ctx.rotate(a);
    ctx.fillStyle = i % 2 ? C.dg : C.fg;
    ctx.beginPath(); ctx.ellipse(0, -l / 2, 22, l / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
  ctx.fillStyle = C.or; ctx.beginPath(); ctx.moveTo(-50, -80); ctx.lineTo(50, -80); ctx.lineTo(38, 0); ctx.lineTo(-38, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.orD; ctx.fillRect(-56, -90, 112, 18);
  ctx.restore();
}

function espresso(ctx, x, y) {
  shadowed(ctx, () => { ctx.fillStyle = '#5B6660'; rr(ctx, x - 110, y - 190, 220, 190, 18); ctx.fill(); }, 16, 6, 0.15);
  ctx.fillStyle = '#C9D0CC'; rr(ctx, x - 110, y - 190, 220, 34, 12); ctx.fill();
  ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(x + 70, y - 130, 12, 0, 7); ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillRect(x - 60, y - 120, 40, 30); ctx.fillRect(x + 10, y - 120, 40, 30);
  ctx.fillStyle = C.w; rr(ctx, x - 58, y - 52, 36, 46, 6); ctx.fill(); rr(ctx, x + 12, y - 52, 36, 46, 6); ctx.fill();
}

function cafeWall(ctx, t, o = {}) {
  ctx.fillStyle = C.wall; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(27,122,61,0.07)'; ctx.fillRect(0, 0, W, 26);
  if (o.night) { ctx.fillStyle = 'rgba(30,40,60,0.10)'; ctx.fillRect(0, 0, W, H); }
}

// ---------- people ----------
// (x, y): point on the counter line, body continues below (hidden by the counter).
function person(ctx, x, y, s, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const skin = o.skin || C.skin, shirt = o.shirt || C.w, apron = o.apron || C.dg;
  if (o.hairStyle === 'bun') { ctx.fillStyle = C.hair; ctx.beginPath(); ctx.arc(8, -408, 30, 0, 7); ctx.fill(); }
  ctx.fillStyle = shirt; rr(ctx, -108, -238, 216, 320, 64); ctx.fill();
  ctx.strokeStyle = '#E2DCD2'; ctx.lineWidth = 3; rr(ctx, -108, -238, 216, 320, 64); ctx.stroke();
  ctx.fillStyle = skin; ctx.fillRect(-21, -272, 42, 44);
  ctx.fillStyle = apron; rr(ctx, -80, -162, 160, 250, 16); ctx.fill();
  ctx.fillStyle = C.or; ctx.fillRect(-80, -162, 160, 11);
  ctx.strokeStyle = apron; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-70, -158); ctx.lineTo(-30, -234); ctx.moveTo(70, -158); ctx.lineTo(30, -234); ctx.stroke();
  ctx.strokeStyle = C.or; ctx.lineWidth = 4; rr(ctx, -40, -92, 80, 52, 8); ctx.stroke();
  // head
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(-58, -326, 11, 17, 0, 0, 7); ctx.ellipse(58, -326, 11, 17, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -332, 58, 68, 0, 0, 7); ctx.fill();
  ctx.fillStyle = C.hair;
  if (o.hairStyle === 'bun') {
    ctx.beginPath(); ctx.ellipse(0, -350, 62, 56, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-52, -338, 13, 30, 0.1, 0, 7); ctx.ellipse(52, -338, 13, 30, -0.1, 0, 7); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(0, -356, 62, 48, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-60, -356); ctx.quadraticCurveTo(-10, -330, 40, -352); ctx.lineTo(60, -356); ctx.fill();
  }
  if (o.earring) { ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(-60, -306, 5, 0, 7); ctx.arc(60, -306, 5, 0, 7); ctx.fill(); }
  // face
  ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineCap = 'round'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-34, -352); ctx.lineTo(-14, -354); ctx.moveTo(14, -354); ctx.lineTo(34, -352); ctx.stroke();
  const eyes = o.eyes || 'open';
  if (eyes === 'tired') {
    ctx.beginPath(); ctx.moveTo(-32, -330); ctx.quadraticCurveTo(-23, -326, -14, -330); ctx.moveTo(14, -330); ctx.quadraticCurveTo(23, -326, 32, -330); ctx.stroke();
  } else if (eyes === 'happy') {
    ctx.beginPath(); ctx.moveTo(-32, -328); ctx.quadraticCurveTo(-23, -340, -14, -328); ctx.moveTo(14, -328); ctx.quadraticCurveTo(23, -340, 32, -328); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(-23, -332, 6.5, 0, 7); ctx.arc(23, -332, 6.5, 0, 7); ctx.fill();
  }
  const m = o.mouth || 'smile';
  if (m === 'flat') { ctx.beginPath(); ctx.moveTo(-12, -296); ctx.lineTo(12, -296); ctx.stroke(); }
  else if (m === 'open') { ctx.beginPath(); ctx.ellipse(0, -296, 10, 8, 0, 0, 7); ctx.fill(); }
  else {
    ctx.beginPath(); ctx.arc(0, -308, 18, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(232,115,26,0.25)'; ctx.beginPath(); ctx.arc(-34, -306, 10, 0, 7); ctx.arc(34, -306, 10, 0, 7); ctx.fill();
  }
  // arms: hand positions in local coordinates
  (o.arms || []).forEach(a => {
    const sx = a.side * 92, sy = -205, [hx, hy] = a.hand;
    const ex = (sx + hx) / 2 + a.side * 34, ey = (sy + hy) / 2 + 26;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#E2DCD2'; ctx.lineWidth = 44;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = shirt; ctx.lineWidth = 38; ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, 21, 0, 7); ctx.fill();
  });
  ctx.lineCap = 'butt';
  ctx.restore();
}

// ---------- notebook (top-down) ----------
const PW = 380, PH = 500;
function rulePage(ctx, o = {}) {
  ctx.fillStyle = o.color || C.paper; ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = C.line; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    if (o.hide && o.hide[i]) continue;
    const y = 130 + i * 44;
    ctx.beginPath(); ctx.moveTo(18, y); ctx.lineTo(PW - 18, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(232,115,26,0.45)';
  ctx.beginPath(); ctx.moveTo(52, 20); ctx.lineTo(52, PH - 20); ctx.stroke();
}
const SALES_ROWS = [['Iced Latte  x2', '5.00'], ['Hot Coffee  x3', '4.50'], ['Lemon Tea  x1', '1.75']];
function entries(ctx, o = {}) {
  if (o.heading !== false) txt(ctx, 'Daily Sales', 64, 84, { fam: 'hand', size: 54, weight: 700 });
  SALES_ROWS.forEach(([a, b], i) => {
    txt(ctx, a, 64, 124 + i * 44, { fam: 'hand', size: 38, weight: 400 });
    txt(ctx, b, PW - 34, 124 + i * 44, { fam: 'hand', size: 38, weight: 400, align: 'right' });
  });
  txt(ctx, 'Total', 64, 256, { fam: 'hand', size: 40, weight: 700 });
  txt(ctx, '11.52', 168, 256, { fam: 'hand', size: 38, weight: 400 });
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(162, 244); ctx.lineTo(232, 242); ctx.stroke();
  txt(ctx, '11.25', PW - 34, 256, { fam: 'hand', size: 40, weight: 700, color: C.or, align: 'right' });
}
const WEEK_ROWS = [['Mon', '38.50'], ['Tue', '45.25'], ['Wed', '41.00'], ['Thu', '52.75'], ['Fri', '60.00']];
function weekEntries(ctx, hideAmt) {
  txt(ctx, 'This week', 64, 84, { fam: 'hand', size: 50, weight: 700 });
  WEEK_ROWS.forEach(([a, b], i) => {
    txt(ctx, a, 64, 124 + i * 44, { fam: 'hand', size: 38, weight: 400 });
    if (!(hideAmt && hideAmt[i])) txt(ctx, b, PW - 34, 124 + i * 44, { fam: 'hand', size: 38, weight: 400, align: 'right' });
  });
}
function coverFront(ctx) {
  ctx.fillStyle = C.or; rr(ctx, 0, -8, PW + 8, PH + 16, 12); ctx.fill();
  ctx.fillStyle = C.orD; ctx.fillRect(0, -8, 24, PH + 16);
  ctx.fillStyle = C.w; rr(ctx, PW / 2 - 100, 170, 220, 100, 14); ctx.fill();
  txt(ctx, 'SALES', PW / 2 + 10, 236, { size: 44, weight: 800, align: 'center' });
}
function coverInside(ctx) {
  ctx.fillStyle = C.or; rr(ctx, -8, -8, PW + 8, PH + 16, 12); ctx.fill();
  ctx.fillStyle = '#F6EBDC'; ctx.fillRect(0, 0, PW, PH);
}
function pageFront(ctx) { rulePage(ctx); }
function pageBack(ctx) { rulePage(ctx); }
function flipEl(ctx, a, front, back) {
  const c = Math.cos(a), lift = 1 + 0.04 * Math.sin(a);
  ctx.save();
  ctx.scale(Math.max(Math.abs(c), 0.001), lift);
  ctx.translate(0, -PH / 2);
  if (c >= 0) front(ctx); else { ctx.translate(-PW, 0); back(ctx); }
  ctx.fillStyle = `rgba(31,42,36,${(1 - Math.abs(c)) * 0.25})`; ctx.fillRect(0, 0, PW, PH);
  ctx.restore();
}
// Open/closed book centred on the spine at (0,0).
function bookTop(ctx, coverA, pageA, rightFn, leftFn) {
  ctx.fillStyle = C.or; rr(ctx, -4, -PH / 2 - 8, PW + 12, PH + 16, 12); ctx.fill();
  ctx.save(); ctx.translate(0, -PH / 2); rulePage(ctx); rightFn && rightFn(ctx); ctx.restore();
  const els = [{ a: coverA, f: coverFront, b: coverInside }].concat(pageA.map((a, i) => ({
    a, f: pageFront, b: i === pageA.length - 1 && leftFn ? (c => { rulePage(c); leftFn(c); }) : pageBack,
  })));
  els.forEach(e => { if (Math.cos(e.a) < 0) flipEl(ctx, e.a, e.f, e.b); });
  [...els].reverse().forEach(e => { if (Math.cos(e.a) >= 0) flipEl(ctx, e.a, e.f, e.b); });
  if (coverA > Math.PI / 2) {
    const g = ctx.createLinearGradient(-26, 0, 26, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(31,42,36,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-26, -PH / 2, 52, PH);
  }
}

// ---------- calculator ----------
const KEYS = [['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['0', '.', '=', '+']];
function calculator(ctx, x, y, s, display, pressed, ok) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadowed(ctx, () => { ctx.fillStyle = C.ink; rr(ctx, 0, 0, 440, 680, 44); ctx.fill(); }, 30, 14, 0.25);
  ctx.fillStyle = ok ? '#D7F0DB' : '#DCE6D8'; rr(ctx, 36, 44, 368, 128, 16); ctx.fill();
  if (ok) { ctx.strokeStyle = C.fg; ctx.lineWidth = 6; rr(ctx, 36, 44, 368, 128, 16); ctx.stroke(); }
  txt(ctx, display, 380, 140, { size: 72, weight: 600, align: 'right', color: C.ink });
  KEYS.forEach((row, r) => row.forEach((k, c) => {
    const kx = 36 + c * 96, ky = 212 + r * 108;
    const pr = pressed && pressed[k] ? pressed[k] : 0;
    ctx.save(); ctx.translate(kx + 40, ky + 44); ctx.scale(1 - 0.08 * pr, 1 - 0.08 * pr);
    ctx.fillStyle = k === '=' ? C.or : (pr > 0 ? '#5E6E65' : '#3A4A42');
    rr(ctx, -40, -44, 80, 88, 18); ctx.fill();
    txt(ctx, k, 0, 14, { size: 38, weight: 600, color: C.w, align: 'center' });
    ctx.restore();
  }));
  ctx.restore();
}
function pressAmt(t, list) { // list of [time, key]
  const o = {};
  list.forEach(([tt, k]) => { const a = t >= tt && t < tt + 0.18 ? 1 - (t - tt) / 0.18 : 0; o[k] = Math.max(o[k] || 0, a); });
  return o;
}

// ---------- phone ----------
function phone(ctx, cx, cy, w, h, rot, screenFn, glow) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  if (glow) {
    const g = ctx.createRadialGradient(0, 0, 40, 0, 0, Math.max(w, h));
    g.addColorStop(0, `rgba(60,181,74,${0.35 * glow})`); g.addColorStop(1, 'rgba(60,181,74,0)');
    ctx.fillStyle = g; ctx.fillRect(-w * 1.6, -h * 1.2, w * 3.2, h * 2.4);
  }
  shadowed(ctx, () => { ctx.fillStyle = C.ink; rr(ctx, -w / 2, -h / 2, w, h, w * 0.14); ctx.fill(); }, 30, 14, 0.25);
  const m = Math.max(6, w * 0.04);
  ctx.save(); rr(ctx, -w / 2 + m, -h / 2 + m, w - 2 * m, h - 2 * m, w * 0.1); ctx.clip();
  ctx.translate(-w / 2 + m, -h / 2 + m);
  screenFn(ctx, w - 2 * m, h - 2 * m);
  ctx.restore();
  ctx.fillStyle = C.ink; rr(ctx, -w * 0.15, -h / 2 + m + 4, w * 0.3, m * 1.6, m); ctx.fill();
  ctx.restore();
}

// ---------- form field ----------
function field(ctx, x, y, w, label, value, o = {}) {
  txt(ctx, label, x, y + 26, { size: o.ls || 24, weight: 600, color: C.grey });
  ctx.fillStyle = C.w; rr(ctx, x, y + 38, w, o.h || 52, 12); ctx.fill();
  ctx.strokeStyle = o.hl ? C.or : '#D5D0C6'; ctx.lineWidth = o.hl ? 4 : 2.5; rr(ctx, x, y + 38, w, o.h || 52, 12); ctx.stroke();
  if (value) txt(ctx, value, x + 18, y + 38 + (o.h || 52) / 2 + 11, { size: o.vs || 30, weight: 500, color: o.vc || C.ink });
}

// =====================================================================
// SCENES (all use absolute time t)
// =====================================================================

// S1 0–3: hook — notebook slams down and flutters open.
function s1(ctx, t) {
  drawWood(ctx);
  ctx.save();
  const push = 1 + 0.03 * p(t, 0, 2.6) + 2.2 * ei(p(t, 2.55, 0.45));
  camera(ctx, 1207, 610, push);
  const dp = p(t, 0, 0.24);
  const y = lerp(-420, 610, ei(dp));
  const sq = 1 - 0.06 * Math.sin(Math.PI * p(t, 0.24, 0.26));
  const sc = lerp(1.18, 1, ei(dp));
  // dust
  const dk = p(t, 0.24, 0.45);
  if (dk > 0 && dk < 1) {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + 0.3, d = 330 + eo(dk) * 160;
      ctx.fillStyle = `rgba(255,248,238,${0.7 * (1 - dk)})`;
      ctx.beginPath(); ctx.arc(1207 + Math.cos(a) * d, 610 + Math.sin(a) * d * 0.75, 10 - 6 * dk, 0, 7); ctx.fill();
    }
  }
  ctx.translate(960, y);
  ctx.scale(1.3 * sc * (1 + (1 - sq) * 0.6), 1.3 * sc * sq);
  const coverA = Math.PI * eio(p(t, 0.5, 0.5));
  const open = Math.max(0, -Math.cos(coverA));
  shadowed(ctx, () => { ctx.fillStyle = C.orD; ctx.fillRect(-PW * open, -PH / 2, PW + PW * open, PH); }, 40 + 30 * (1 - dp), 18, 0.35 * dp);
  const pageA = [0, 1, 2, 3, 4, 5].map(i => Math.PI * eio(p(t, 0.72 + i * 0.08, 0.36)));
  bookTop(ctx, coverA, pageA, c => entries(c), c => { ctx.globalAlpha = 0.55; weekEntries(c); ctx.globalAlpha = 1; });
  ctx.restore();
  wordsUp(ctx, 'Still running on paper?', 960, 170, t, 1.05, { size: 88, weight: 800, color: C.w, shadow: true, alpha: 1 - p(t, 2.6, 0.3) });
}

// S2 3–7: three disconnected tools.
function s2(ctx, t) {
  paperBg(ctx);
  const titles = ['Paper.', 'Chat.', 'Calculator.'];
  const size = 76;
  const sp = tw(ctx, ' ', 800, size), ws = titles.map(s => tw(ctx, s, 800, size));
  let x = 960 - (ws.reduce((a, b) => a + b) + sp * 2) / 2;
  titles.forEach((s, i) => {
    const k = eo(p(t, 3.15 + i * 0.24, 0.4));
    txt(ctx, s, x, 160 + (1 - k) * 24, { size, weight: 800, alpha: k, color: i === 2 ? C.or : C.ink });
    x += ws[i] + sp;
  });
  for (let i = 0; i < 3; i++) {
    const xt = 130 + i * 575;
    const k = eo(p(t, 3.0 + i * 0.24, 0.45));
    const px = lerp(-640, xt, k);
    panel2(ctx, i, px, 240, 510, 650, t);
  }
}
function panel2(ctx, i, x, y, w, h, t) {
  card(ctx, x, y, w, h, 30);
  ctx.save(); rr(ctx, x, y, w, h, 30); ctx.clip();
  if (i === 0) {
    ctx.save(); ctx.translate(x + 25, y + 30); ctx.scale(1.21, 1.21); rulePage(ctx);
    txt(ctx, 'Daily Sales', 64, 84, { fam: 'hand', size: 54, weight: 700 });
    const lines = [['Iced Latte  x2 — 5.00', 3.5, 4.8], ['Hot Coffee  x3 — 4.50', 4.95, 6.2]];
    lines.forEach(([s, a, b], j) => {
      const k = p(t, a, b - a);
      if (k <= 0) return;
      const fw = tw(ctx, s, 400, 38, 'hand');
      ctx.save(); ctx.beginPath(); ctx.rect(60, 124 + j * 44 - 44, 4 + fw * k, 60); ctx.clip();
      txt(ctx, s, 64, 124 + j * 44, { fam: 'hand', size: 38, weight: 400 });
      ctx.restore();
      if (k < 1) { // pen
        const px = 64 + fw * k, py = 124 + j * 44 - 6 + Math.sin(t * 40) * 3;
        ctx.save(); ctx.translate(px, py); ctx.rotate(0.6);
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -18); ctx.lineTo(7, -18); ctx.fill();
        ctx.fillStyle = C.or; rr(ctx, -9, -150, 18, 134, 6); ctx.fill();
        ctx.restore();
      }
    });
    ctx.restore();
  } else if (i === 1) {
    phone(ctx, x + w / 2, y + h / 2, 300, 580, 0, (c, sw, sh) => {
      c.fillStyle = '#F1F5F2'; c.fillRect(0, 0, sw, sh);
      c.fillStyle = C.dg; c.fillRect(0, 0, sw, 74);
      txt(c, 'Team chat', 24, 52, { size: 24, weight: 700, color: C.w });
      const msgs = [[3.85, 'photo', 96], [4.55, 'Milk: 2 left?', 270], [5.25, 'photo', 350]];
      msgs.forEach(([tt, m, my]) => {
        const k = p(t, tt, 0.3); if (k <= 0) return;
        const s = back(k, 1.6);
        c.save(); c.translate(20, my); c.scale(s, s);
        if (m === 'photo') {
          c.fillStyle = C.w; rr(c, 0, 0, 200, 160, 16); c.fill();
          c.fillStyle = '#F6EFE3'; rr(c, 12, 12, 176, 136, 8); c.fill();
          c.strokeStyle = '#B9AE9C'; c.lineWidth = 4;
          for (let r = 0; r < 5; r++) { c.beginPath(); c.moveTo(26, 36 + r * 24); c.lineTo(26 + 80 + ((r * 37) % 60), 36 + r * 24); c.stroke(); }
        } else {
          c.fillStyle = C.w; rr(c, 0, 0, 220, 60, 16); c.fill();
          txt(c, m, 18, 40, { size: 24, weight: 500 });
        }
        c.restore();
      });
    });
  } else {
    const seq = [[3.6, '5'], [3.95, '+'], [4.3, '4'], [4.55, '.'], [4.8, '5'], [5.15, '='], [5.6, '+'], [5.95, '1'], [6.2, '.'], [6.45, '7']];
    const disp = t < 3.6 ? '0' : t < 4.3 ? '5' : t < 4.55 ? '4' : t < 4.8 ? '4.' : t < 5.15 ? '4.5' : t < 5.95 ? '9.5' : t < 6.2 ? '1' : t < 6.45 ? '1.' : '1.7';
    calculator(ctx, x + w / 2 - 205, y + 15, 0.93, disp, pressAmt(t, seq));
  }
  ctx.restore();
}

// S3 7–11: late night, work piles up.
function s3(ctx, t) {
  ctx.save();
  const z = 1 + 3.2 * ei(p(t, 10.4, 0.6));
  camera(ctx, 1170, 590, z);
  cafeWall(ctx, t, { night: true });
  windowPane(ctx, 70, 130, 420, 440, true, t - 7);
  clock(ctx, 1640, 200, 82, 10, 30);
  lamp(ctx, 760, 90, true);
  // owner rubbing eyes
  const up = eio(p(t, 9.35, 0.3)) * (1 - eio(p(t, 10.0, 0.3)));
  const rub = Math.sin((t - 9.65) * 30) * 8 * (t > 9.65 && t < 10.0 ? 1 : 0);
  const hand = [lerp(-95, -26 + rub, up), lerp(-14, -318, up)];
  person(ctx, 760, 730, 1, { hairStyle: 'bun', earring: true, eyes: 'tired', mouth: 'flat', arms: [{ side: -1, hand }, { side: 1, hand: [95, -14] }] });
  counter(ctx, 730);
  // calculator on counter
  ctx.save(); ctx.translate(500, 742); ctx.fillStyle = C.ink; rr(ctx, 0, -60, 110, 60, 10); ctx.fill(); ctx.fillStyle = '#DCE6D8'; ctx.fillRect(12, -50, 86, 18); ctx.restore();
  // stack of notebooks
  const cols = [C.or, C.dg, C.or, C.fg];
  const wob = 3 * Math.PI / 180 * Math.sin((t - 8.85) * 14) * Math.exp(-(t - 8.85) * 4) * (t > 8.85 ? 1 : 0);
  ctx.save(); ctx.translate(1170, 730); ctx.rotate(wob);
  cols.forEach((col, i) => {
    const land = 7.3 + i * 0.5;
    const k = p(t, land - 0.3, 0.3);
    if (k <= 0) return;
    const by = -(i + 1) * 40 - lerp(560, 0, ei(k)) - (t > land ? 6 * Math.sin(Math.PI * p(t, land, 0.15)) : 0);
    ctx.fillStyle = col; rr(ctx, -160, by, 320, 38, 8); ctx.fill();
    ctx.fillStyle = C.paper; ctx.fillRect(-146, by + 9, 300, 20);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(-146, by + 14 + l * 5); ctx.lineTo(154, by + 14 + l * 5); ctx.stroke(); }
  });
  ctx.restore();
  ctx.restore();
  wordsUp(ctx, 'Business grows. Work grows.', 1040, 110, t, 7.4, { size: 66, weight: 800, alpha: 1 - p(t, 10.35, 0.25) });
}

// S4 11–15: the idea — circle "Daily Sales", it lifts off the page.
const S4 = { s: 1.9, ox: 599, oy: 58 };
function s4(ctx, t, skipHead) {
  drawWood(ctx);
  ctx.save(); ctx.translate(S4.ox, S4.oy); ctx.scale(S4.s, S4.s);
  shadowed(ctx, () => { ctx.fillStyle = C.paper; ctx.fillRect(0, 0, PW, PH); }, 30, 10, 0.3);
  rulePage(ctx); entries(ctx, { heading: false });
  ctx.restore();
  if (!skipHead) s4Head(ctx, t);
}
function s4Head(ctx, t) {
  const hx = S4.ox + 168 * S4.s, hy = S4.oy + 66 * S4.s; // heading centre
  const lift = eo(p(t, 12.3, 0.6));
  const fly = eio(p(t, 14.2, 0.8));
  const cx = lerp(hx, 640, fly), cy = lerp(hy, 712, fly) - 30 * Math.sin(Math.PI * fly) * 4;
  const sc = (1 + 0.12 * lift) * lerp(1, 0.42, fly);
  const a = 1 - p(t, 14.85, 0.15);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.scale(sc, sc);
  if (lift > 0) {
    ctx.fillStyle = `rgba(31,42,36,${0.18 * lift})`;
    ctx.beginPath(); ctx.ellipse(18 * lift, 30 + 26 * lift, 230, 50, 0, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,248,238,${0.92 * lift})`; rr(ctx, -250, -70, 500, 140, 70); ctx.fill();
    ctx.shadowColor = `rgba(232,115,26,${0.6 * lift})`; ctx.shadowBlur = 40 * lift;
  }
  const col = fly > 0.4 ? C.or : C.ink;
  txt(ctx, 'Daily Sales', 0, 34, { fam: 'hand', size: 54 * S4.s, weight: 700, align: 'center', color: col });
  ctx.shadowBlur = 0;
  // orange circle drawn by hand (two passes)
  const cp = eo(p(t, 11.45, 0.65));
  if (cp > 0) {
    ctx.strokeStyle = C.or; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath();
    const n = Math.floor(80 * cp) + 1;
    for (let i = 0; i <= n; i++) {
      const u = i / 80 * 2.15 * Math.PI - 2.4;
      const r = 1 + 0.04 * Math.sin(u * 3);
      const px = Math.cos(u) * 245 * r, py = Math.sin(u) * 78 * r + (u > 2 ? 6 : 0);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke(); ctx.lineCap = 'butt';
  }
  ctx.restore();
}

// S5 15–22: describe it — the prompt.
const PROMPT = [['Build'], ['a'], ['simple'], ['daily'], ['sales'], ['form', 1], ['for'], ['my'], ['coffee'], ['shop.'],
  ['Fields:'], ['date,', 1], ['item,', 1], ['quantity,', 1], ['price,', 1], ['total.', 1], ['Show'], ['a'], ['daily', 1], ['summary.', 1]];
function s5(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E6F2E9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  card(ctx, 360, 130, 1200, 790, 30);
  ctx.strokeStyle = '#ECE8E1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(360, 214); ctx.lineTo(1560, 214); ctx.stroke();
  ['#E6E1D8', '#E6E1D8', '#E6E1D8'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(404 + i * 30, 172, 9, 0, 7); ctx.fill(); });
  ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(890, 172, 13, 0, 7); ctx.fill();
  txt(ctx, 'AI Chat', 916, 183, { size: 32, weight: 700 });
  // assistant bubble
  const bk = eo(p(t, 15.0, 0.4));
  ctx.save(); ctx.globalAlpha *= bk;
  ctx.fillStyle = '#F2EFEA'; rr(ctx, 410, 250, 640, 84, 24); ctx.fill();
  txt(ctx, 'What would you like to build today?', 440, 303, { size: 30, weight: 500, color: C.grey });
  ctx.restore();
  // input box
  const focus = p(t, 15.3, 0.3);
  ctx.fillStyle = '#FFFFFF'; rr(ctx, 400, 600, 1120, 290, 22); ctx.fill();
  ctx.strokeStyle = focus > 0 ? C.or : '#DDD8CF'; ctx.lineWidth = 2 + 2 * focus; rr(ctx, 400, 600, 1120, 290, 22); ctx.stroke();
  const n = clamp(Math.floor((t - 15.6) / 0.24) + 1, 0, PROMPT.length);
  let x = 440, y = 674; const maxX = 1400, size = 42;
  const sp = tw(ctx, ' ', 500, size);
  for (let i = 0; i < n; i++) {
    const [w, hl] = PROMPT[i];
    const ww = tw(ctx, w, hl ? 700 : 500, size);
    if (x + ww > maxX) { x = 440; y += 64; }
    const k = p(t, 15.6 + i * 0.24, 0.12);
    txt(ctx, w, x, y, { size, weight: hl ? 700 : 500, color: hl ? C.or : C.ink, alpha: k });
    x += ww + sp;
  }
  if (focus > 0 && Math.floor(t * 2.5) % 2 === 0 && t < 21.3) { ctx.fillStyle = C.or; ctx.fillRect(x - 6, y - 38, 4, 46); }
  // send button
  const press = t > 21.25 && t < 21.45 ? 0.88 : 1;
  ctx.save(); ctx.translate(1460, 832); ctx.scale(press * pop(t, 21.45, 0.2, 0.12), press * pop(t, 21.45, 0.2, 0.12));
  ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(0, 0, 38, 0, 7); ctx.fill();
  ctx.strokeStyle = C.w; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -16); ctx.moveTo(-12, -4); ctx.lineTo(0, -16); ctx.lineTo(12, -4); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.restore();
  const rk = p(t, 21.45, 0.55);
  if (rk > 0) {
    ctx.strokeStyle = `rgba(232,115,26,${1 - rk})`; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(1460, 832, 40 + 1400 * eo(rk), 0, 7); ctx.stroke();
  }
  stepLabel(ctx, t, 15.3, 1, 'Describe');
  const fl = p(t, 21.7, 0.3);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${eo(fl)})`; ctx.fillRect(0, 0, W, H); }
}

// S6 22–30: AI builds the first draft (hero shot).
const FIELDS = ['Date', 'Item', 'Quantity', 'Price', 'Total'];
const PLACE = ['dd/mm/yyyy', 'e.g. Iced Latte', '0', '$0.00', 'auto'];
const WEEK_VALS = [38.5, 45.25, 41, 52.75, 60];
function s6Layout(t) {
  const orb = eio(p(t, 22, 8));
  const lx = 800 - 46 * orb, ly = 140, lw = 1000, lh = 600;
  const sx = lx + 22, sy = ly + 22, sw = lw - 44, sh = lh - 50;
  return { orb, lx, ly, lw, lh, sx, sy, sw, sh, nx: 400 + 56 * orb, ny: 850 };
}
function s6(ctx, t) {
  const L = s6Layout(t);
  const g = ctx.createLinearGradient(0, 0, 0, 680); g.addColorStop(0, '#F7F0E6'); g.addColorStop(1, '#EDE1CF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#C08857'; ctx.fillRect(0, 680, W, H - 680);
  ctx.fillStyle = C.woodL; ctx.fillRect(0, 680, W, 14);
  // notebook on desk (perspective by skew)
  const peeled = FIELDS.map((f, i) => t >= 22.6 + i * 0.35);
  const flown = WEEK_VALS.map((v, i) => t >= 26.4 + i * 0.1);
  ctx.save();
  ctx.translate(L.nx, L.ny); ctx.transform(1, 0, -0.22, 0.56, 0, 0); ctx.scale(0.86, 0.86);
  shadowed(ctx, () => { ctx.fillStyle = C.or; rr(ctx, -PW - 10, -PH / 2 - 10, PW * 2 + 20, PH + 20, 14); ctx.fill(); }, 20, 10, 0.3);
  ctx.save(); ctx.translate(-PW, -PH / 2); rulePage(ctx); weekEntries(ctx, flown); ctx.restore();
  ctx.save(); ctx.translate(0, -PH / 2); rulePage(ctx, { hide: peeled }); ctx.restore();
  const m = ctx.getTransform();
  ctx.restore();
  const toScreen = (x, y) => { const q = m.transformPoint(new DOMPoint(x, y)); return [q.x, q.y]; };
  // laptop
  shadowed(ctx, () => { ctx.fillStyle = '#2B3530'; rr(ctx, L.lx, L.ly, L.lw, L.lh, 26); ctx.fill(); }, 40, 16, 0.25);
  ctx.fillStyle = '#C9CFCB';
  ctx.beginPath(); ctx.moveTo(L.lx - 70, L.ly + L.lh + 40); ctx.lineTo(L.lx + L.lw + 70, L.ly + L.lh + 40); ctx.lineTo(L.lx + L.lw, L.ly + L.lh); ctx.lineTo(L.lx, L.ly + L.lh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#AEB6B1'; ctx.fillRect(L.lx - 70, L.ly + L.lh + 40, L.lw + 140, 10);
  // screen
  ctx.save(); rr(ctx, L.sx, L.sy, L.sw, L.sh, 10); ctx.clip();
  ctx.fillStyle = '#F7F7F4'; ctx.fillRect(L.sx, L.sy, L.sw, L.sh);
  const bar = eo(p(t, 22.15, 0.4));
  ctx.fillStyle = C.dg; ctx.fillRect(L.sx, L.sy - 60 + 60 * bar, L.sw, 60);
  txt(ctx, 'Daily Sales', L.sx + 28, L.sy + 42 - 60 + 60 * bar, { size: 30, weight: 700, color: C.w });
  const pk = p(t, 22.6, 0.3);
  if (pk > 0) {
    ctx.save(); ctx.translate(L.sx + L.sw - 120, L.sy + 30); ctx.scale(back(pk, 2), back(pk, 2));
    ctx.fillStyle = C.or; rr(ctx, -96, -20, 192, 40, 20); ctx.fill();
    txt(ctx, 'FIRST DRAFT', 0, 9, { size: 20, weight: 700, color: C.w, align: 'center' });
    ctx.restore();
  }
  // form fields (appear when strips arrive)
  FIELDS.forEach((f, i) => {
    const arrive = 22.6 + i * 0.35 + 0.85;
    if (t < arrive) return;
    const fx = L.sx + 28, fy = L.sy + 76 + i * 92, s = pop(t, arrive, 0.22, 0.09);
    ctx.save(); ctx.translate(fx + 180, fy + 64); ctx.scale(s, s); ctx.translate(-(fx + 180), -(fy + 64));
    field(ctx, fx, fy, 360, f, PLACE[i], { vc: '#B3ADA3', vs: 24, h: 50, ls: 22 });
    ctx.restore();
  });
  // table
  const tx = L.sx + 420, ty = L.sy + 84, cw = [200, 80, 110, 118];
  let cx = tx;
  cw.forEach((w, j) => {
    const k = eo(p(t, 25.0 + j * 0.12, 0.4));
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * -40);
      ctx.fillStyle = C.gL; ctx.fillRect(cx, ty, w - 4, 44);
      txt(ctx, ['Item', 'Qty', 'Price', 'Total'][j], cx + 14, ty + 30, { size: 20, weight: 700, color: C.dg });
      ctx.restore();
    }
    cx += w;
  });
  for (let r = 0; r < 3; r++) {
    const k = eo(p(t, 25.6 + r * 0.15, 0.4));
    if (k <= 0) continue;
    ctx.fillStyle = '#ECE8E1'; rr(ctx, tx + 10, ty + 62 + r * 40, 480 * k, 18, 9); ctx.fill();
  }
  // chart
  const ck = eo(p(t, 26.2, 0.4));
  const chx = tx, chy = L.sy + 270, chw = 500, chh = 250, base = chy + chh - 44;
  if (ck > 0) {
    ctx.save(); ctx.globalAlpha *= ck;
    ctx.fillStyle = C.w; rr(ctx, chx, chy, chw, chh, 14); ctx.fill();
    ctx.strokeStyle = '#ECE8E1'; ctx.lineWidth = 2; rr(ctx, chx, chy, chw, chh, 14); ctx.stroke();
    txt(ctx, 'Daily summary', chx + 18, chy + 34, { size: 20, weight: 700, color: C.grey });
    ctx.strokeStyle = '#D5D0C6'; ctx.beginPath(); ctx.moveTo(chx + 18, base); ctx.lineTo(chx + chw - 18, base); ctx.stroke();
    ctx.restore();
  }
  WEEK_VALS.forEach((v, i) => {
    const bx = chx + 40 + i * 92;
    const k = eo(p(t, 27.1 + i * 0.12, 0.5));
    if (k > 0) {
      const bh = 150 * (v / 60) * k;
      ctx.fillStyle = i === 4 ? C.or : C.fg; rr(ctx, bx, base - bh, 56, bh, 8); ctx.fill();
      txt(ctx, WEEK_ROWS[i][0], bx + 28, base + 28, { size: 18, weight: 600, color: C.grey, align: 'center', alpha: k });
    }
  });
  // shimmer
  const shk = p(t, 28.4, 0.6);
  if (shk > 0 && shk < 1) {
    const gx = lerp(L.sx - 300, L.sx + L.sw + 300, shk);
    const sg = ctx.createLinearGradient(gx - 150, 0, gx + 150, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(L.sx, L.sy, L.sw, L.sh);
  }
  ctx.restore();
  // flying strips (ruled lines → form fields)
  FIELDS.forEach((f, i) => {
    const ts = 22.6 + i * 0.35;
    if (t < ts || t >= ts + 0.85) return;
    const ly = 130 + i * 44 - PH / 2;
    const a0 = toScreen(18, ly), a1 = toScreen(PW - 18, ly);
    const pk2 = eo(p(t, ts, 0.25)), fk = eio(p(t, ts + 0.25, 0.6));
    const sx0 = (a0[0] + a1[0]) / 2, sy0 = (a0[1] + a1[1]) / 2 - 24 * pk2;
    const len0 = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), ang0 = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) - 0.25 * pk2;
    const tx2 = L.sx + 28 + 180, ty2 = L.sy + 76 + i * 92 + 63;
    const cxm = (sx0 + tx2) / 2 - 80, cym = Math.min(sy0, ty2) - 260;
    const u = fk, v = 1 - u;
    const px = v * v * sx0 + 2 * v * u * cxm + u * u * tx2, py = v * v * sy0 + 2 * v * u * cym + u * u * ty2;
    const len = lerp(len0, 360, fk), hh = lerp(10, 50, fk), ang = lerp(ang0, 0, fk) + Math.sin(Math.PI * fk) * 0.5;
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    shadowed(ctx, () => { ctx.fillStyle = fk > 0.6 ? C.w : C.paper; rr(ctx, -len / 2, -hh / 2, len, hh, Math.min(12, hh / 2)); ctx.fill(); }, 16, 8, 0.25);
    ctx.strokeStyle = fk > 0.6 ? '#D5D0C6' : C.line; ctx.lineWidth = 2.5;
    if (fk > 0.6) { rr(ctx, -len / 2, -hh / 2, len, hh, 12); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-len / 2 + 4, 0); ctx.lineTo(len / 2 - 4, 0); ctx.stroke(); }
    ctx.restore();
  });
  // flying handwritten totals → chart bars
  WEEK_VALS.forEach((v, i) => {
    const ts = 26.4 + i * 0.1;
    const k = eio(p(t, ts, 0.65));
    if (t < ts || k >= 1) return;
    const [x0, y0] = toScreen(-34 - 50, 124 + i * 44 - PH / 2 - 12);
    const x1 = chx + 68 + i * 92, y1 = base - 10;
    const px = lerp(x0, x1, k), py = lerp(y0, y1, k) - Math.sin(Math.PI * k) * 160;
    txt(ctx, WEEK_ROWS[i][1], px, py, { fam: 'hand', size: lerp(30, 34, k), weight: 700, color: C.or, align: 'center', alpha: 1 - p(t, ts + 0.5, 0.15) });
  });
  stepLabel(ctx, t, 22.35, 2, 'Build — first draft');
  const wf = 1 - p(t, 22.0, 0.3);
  if (wf > 0) { ctx.fillStyle = `rgba(255,255,255,${wf})`; ctx.fillRect(0, 0, W, H); }
}

// S7 30–37: test it with the old calculator.
function s7(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F7F0E6'); g.addColorStop(1, '#EDE1CF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#C08857'; ctx.fillRect(0, 900, W, 180); ctx.fillStyle = C.woodL; ctx.fillRect(0, 900, W, 12);
  const X = 110, Y = 180, Wd = 1030, Hd = 640;
  card(ctx, X, Y, Wd, Hd, 28);
  ctx.save(); rr(ctx, X, Y, Wd, Hd, 28); ctx.clip();
  ctx.fillStyle = C.dg; ctx.fillRect(X, Y, Wd, 84);
  txt(ctx, 'Daily Sales', X + 40, Y + 56, { size: 36, weight: 700, color: C.w });
  ctx.restore();
  const cols = [[150, 'Item'], [520, 'Qty'], [670, 'Price'], [870, 'Total']];
  ctx.fillStyle = C.gL; ctx.fillRect(X + 30, Y + 110, Wd - 60, 62);
  cols.forEach(([cx, h]) => txt(ctx, h, cx, Y + 152, { size: 28, weight: 700, color: C.dg }));
  const rows = [[30.8, 'Iced Latte', '2', '$2.50', '$5.00'], [31.9, 'Hot Coffee', '3', '$1.50', '$4.50']];
  rows.forEach(([t0, a, b, c, d], r) => {
    const ry = Y + 236 + r * 80;
    ctx.strokeStyle = '#ECE8E1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 30, ry + 26); ctx.lineTo(X + Wd - 30, ry + 26); ctx.stroke();
    const vals = [a, b, c, d];
    vals.forEach((v, j) => {
      const k = p(t, t0 + j * 0.18, 0.18);
      if (k <= 0) return;
      const s = j === 0 ? v.slice(0, Math.ceil(v.length * k)) : v;
      txt(ctx, s, cols[j][0], ry, { size: 34, weight: j === 3 ? 700 : 500, alpha: j === 0 ? 1 : k, color: j === 3 ? C.dg : C.ink });
    });
  });
  // total row
  const ok = t >= 35.6;
  ctx.fillStyle = ok ? '#E3F4E6' : '#FFF1E4'; rr(ctx, X + 30, Y + 410, Wd - 60, 96, 16); ctx.fill();
  if (ok) { ctx.strokeStyle = C.fg; ctx.lineWidth = 5; rr(ctx, X + 30, Y + 410, Wd - 60, 96, 16); ctx.stroke(); }
  txt(ctx, "Today's total", X + 60, Y + 472, { size: 34, weight: 600 });
  const val = 9.5 * eo(p(t, 32.9, 0.9));
  txt(ctx, money(val), X + Wd - 60, Y + 476, { size: 50, weight: 800, align: 'right', color: ok ? C.dg : C.ink });
  // calculator
  const seq = [[34.1, '5'], [34.4, '+'], [34.7, '4'], [34.9, '.'], [35.1, '5'], [35.4, '=']];
  const disp = t < 34.1 ? '0' : t < 34.7 ? '5' : t < 34.9 ? '4' : t < 35.1 ? '4.' : t < 35.4 ? '4.5' : '9.5';
  calculator(ctx, 1330, 170, 1, disp, pressAmt(t, seq), ok);
  const ck = p(t, 35.6, 0.45);
  if (ck > 0) {
    const s = back(p(t, 35.6, 0.25), 2);
    ctx.save(); ctx.translate(1236, 500); ctx.scale(s, s);
    ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(0, 0, 56, 0, 7); ctx.fill();
    ctx.strokeStyle = C.w; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const q = eo(p(t, 35.75, 0.3));
    ctx.beginPath(); ctx.moveTo(-24, 2);
    if (q < 0.4) ctx.lineTo(lerp(-24, -6, q / 0.4), lerp(2, 20, q / 0.4));
    else { ctx.lineTo(-6, 20); ctx.lineTo(lerp(-6, 26, (q - 0.4) / 0.6), lerp(20, -18, (q - 0.4) / 0.6)); }
    ctx.stroke(); ctx.restore();
  }
  stepLabel(ctx, t, 30.3, 3, 'Test it yourself');
}

// S8 37–41: improve it — add the missing field, then fold into a card.
function s8Card(ctx, t) {
  const X = 560, Y = 60, Wd = 800, Hd = 780;
  card(ctx, X, Y, Wd, Hd, 30);
  ctx.save(); rr(ctx, X, Y, Wd, Hd, 30); ctx.clip();
  ctx.fillStyle = C.dg; ctx.fillRect(X, Y, Wd, 90);
  txt(ctx, 'New sale', X + 40, Y + 60, { size: 38, weight: 700, color: C.w });
  ctx.restore();
  const ins = eio(p(t, 39.4, 0.5));
  const list = [['Date', 'Today'], ['Item', 'Iced Latte'], ['Quantity', '2'], ['Price', '$2.50']];
  list.forEach(([a, b], i) => field(ctx, X + 50, Y + 120 + i * 100, Wd - 100, a, b));
  field(ctx, X + 50, Y + 120 + 4 * 100 + 100 * ins, Wd - 100, 'Total', '$5.00', { vc: C.dg });
  const pk = p(t, 39.45, 0.5);
  if (pk > 0) {
    const fy = Y + 120 + 4 * 100;
    ctx.save(); ctx.globalAlpha *= clamp(pk * 2); ctx.translate((1 - back(pk, 1.4)) * 320, 0);
    txt(ctx, 'Payment', X + 50, fy + 26, { size: 24, weight: 600, color: C.or });
    ['Cash', 'KHQR'].forEach((s, j) => {
      const cs = back(p(t, 39.8 + j * 0.1, 0.3), 2);
      ctx.save(); ctx.translate(X + 50 + 90 + j * 200, fy + 64); ctx.scale(cs, cs);
      ctx.fillStyle = j === 0 ? C.or : C.w; rr(ctx, -90, -26, 180, 52, 26); ctx.fill();
      ctx.strokeStyle = C.or; ctx.lineWidth = 3; rr(ctx, -90, -26, 180, 52, 26); ctx.stroke();
      txt(ctx, s, 0, 10, { size: 28, weight: 600, color: j === 0 ? C.w : C.or, align: 'center' });
      ctx.restore();
    });
    ctx.restore();
  }
}
function shareCard(ctx, cx, cy, s, press, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.scale(s, s);
  card(ctx, -190, -110, 380, 220, 26);
  txt(ctx, 'Daily Sales app', 0, -42, { size: 28, weight: 600, align: 'center' });
  ctx.save(); ctx.translate(0, 34); ctx.scale(press, press);
  ctx.fillStyle = C.or; rr(ctx, -130, -32, 260, 64, 32); ctx.fill();
  txt(ctx, 'Share link', 0, 11, { size: 30, weight: 700, color: C.w, align: 'center' });
  ctx.restore();
  ctx.restore();
}
function s8(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E6F2E9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const q1 = eio(p(t, 40.4, 0.3)), q2 = eio(p(t, 40.7, 0.3));
  const uiA = 1 - p(t, 40.35, 0.2);
  ctx.save();
  ctx.translate(960, 450);
  ctx.scale(lerp(1, 0.475, q2), lerp(1, 0.5, q1) * lerp(1, 0.564, q2));
  ctx.translate(-960, -450);
  s8Card(ctx, t);
  if (q1 > 0) { ctx.fillStyle = `rgba(31,42,36,${0.18 * Math.sin(Math.PI * q1) + 0.08 * q2})`; rr(ctx, 560, 450, 800, 390, 30); ctx.fill(); }
  ctx.restore();
  const sa = p(t, 40.82, 0.18);
  if (sa > 0) shareCard(ctx, 960, 450, 1, 1, sa);
  ctx.save(); ctx.globalAlpha *= uiA;
  // "?" bubble → check
  const qa = eo(p(t, 37.5, 0.3));
  if (qa > 0) {
    const fixed = t >= 40.0;
    const s = fixed ? back(p(t, 40.0, 0.25), 2) : (0.9 + 0.1 * qa) * (1 + 0.08 * Math.sin((t - 37.5) * 9));
    ctx.save(); ctx.translate(1420, 560); ctx.scale(s, s); ctx.globalAlpha *= qa;
    ctx.fillStyle = fixed ? C.fg : C.or; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fill();
    if (fixed) {
      ctx.strokeStyle = C.w; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-16, 2); ctx.lineTo(-4, 14); ctx.lineTo(18, -12); ctx.stroke(); ctx.lineCap = 'butt';
    } else txt(ctx, '?', 0, 17, { size: 50, weight: 800, color: C.w, align: 'center' });
    ctx.restore();
  }
  // prompt bar
  const pb = eo(p(t, 37.95, 0.3));
  if (pb > 0) {
    ctx.save(); ctx.globalAlpha *= pb; ctx.translate(0, (1 - pb) * 30);
    ctx.fillStyle = C.w; rr(ctx, 560, 862, 800, 74, 37); ctx.fill();
    ctx.strokeStyle = C.or; ctx.lineWidth = 3; rr(ctx, 560, 862, 800, 74, 37); ctx.stroke();
    const s = 'Add payment: Cash / KHQR';
    const n = Math.floor(s.length * p(t, 38.2, 1.0));
    txt(ctx, s.slice(0, n), 600, 912, { size: 32, weight: 500 });
    ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(1318, 899, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = C.w; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(1318, 911); ctx.lineTo(1318, 887); ctx.moveTo(1308, 897); ctx.lineTo(1318, 887); ctx.lineTo(1328, 897); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.restore();
  }
  ctx.restore();
  stepLabel(ctx, t, 37.3, 0, 'Ask AI to fix it', 40.3);
}

// S9 41–47: deploy — share the link, it flies to the barista as a paper plane.
const PLANE = [[-60, -42], [55, -4], [62, 0], [55, 4], [-60, 42]];
const CARDPTS = [[-152, -88], [152, -88], [152, 0], [152, 88], [-152, 88]];
const PATH = [[650, 430], [860, 150], [1270, 250], [1398, 556]];
function cafeScene(ctx, t, o) {
  cafeWall(ctx, t, o);
  windowPane(ctx, 70, 130, 400, 430, o.night, t - 41);
  menuBoard(ctx, 860, 120, 340, 290);
  lamp(ctx, 560, 80, true); lamp(ctx, 1460, 80, true);
}
function miniForm(c, sw, sh, k) {
  c.fillStyle = '#F7F7F4'; c.fillRect(0, 0, sw, sh);
  c.globalAlpha = k;
  c.fillStyle = C.dg; c.fillRect(0, 0, sw, sh * 0.16);
  c.fillStyle = '#DDD8CF';
  for (let i = 0; i < 4; i++) { rr(c, sw * 0.1, sh * 0.24 + i * sh * 0.15, sw * 0.8, sh * 0.08, 4); c.fill(); }
  c.fillStyle = C.or; rr(c, sw * 0.1, sh * 0.84, sw * 0.8, sh * 0.09, 6); c.fill();
  c.globalAlpha = 1;
}
function s9(ctx, t) {
  cafeScene(ctx, t, { night: false });
  plant(ctx, 990, 708, 1.25);
  espresso(ctx, 1730, 712);
  // owner
  person(ctx, 560, 712, 1, { hairStyle: 'bun', earring: true, eyes: 'open', mouth: 'smile', arms: [{ side: 1, hand: [128, -270] }, { side: -1, hand: [-95, -14] }] });
  // barista with phone
  const land = 45.6;
  person(ctx, 1460, 712, 1, { hairStyle: 'short', eyes: t > land ? 'happy' : 'open', mouth: 'smile', arms: [{ side: -1, hand: [-64, -100] }, { side: 1, hand: [95, -14] }] });
  counter(ctx, 712);
  const ps = t > land ? pop(t, land, 0.3, 0.25) : 1;
  phone(ctx, 1398, 590, 92 * ps, 172 * ps, -0.08, (c, sw, sh) => {
    if (t < land) { c.fillStyle = '#2E3A34'; c.fillRect(0, 0, sw, sh); } else miniForm(c, sw, sh, p(t, land, 0.2));
  });
  // card → plane
  if (t < land) {
    const mv = eio(p(t, 41.0, 0.6));
    const cx0 = lerp(960, 650, mv), cy0 = lerp(450, 430, mv), s0 = lerp(1, 0.8, mv);
    const morph = eio(p(t, 42.45, 0.45));
    const fly = eio(p(t, 42.9, land - 42.9));
    if (morph < 0.02) {
      const press = t > 42.15 && t < 42.32 ? 0.9 : 1;
      shareCard(ctx, cx0, cy0, s0, press);
      const rk = p(t, 42.3, 0.4);
      if (rk > 0 && rk < 1) { ctx.strokeStyle = `rgba(232,115,26,${1 - rk})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx0, cy0 + 27, 40 + 120 * rk, 0, 7); ctx.stroke(); }
    } else {
      const u = fly;
      const px = bez(PATH[0][0], PATH[1][0], PATH[2][0], PATH[3][0], u), py = bez(PATH[0][1], PATH[1][1], PATH[2][1], PATH[3][1], u);
      const ang = fly > 0 ? Math.atan2(bezD(PATH[0][1], PATH[1][1], PATH[2][1], PATH[3][1], u), bezD(PATH[0][0], PATH[1][0], PATH[2][0], PATH[3][0], u)) : 0;
      // trail
      for (let k = 1; k <= 14; k++) {
        const uu = u - k * 0.025; if (uu <= 0) break;
        const tx = bez(PATH[0][0], PATH[1][0], PATH[2][0], PATH[3][0], uu), ty = bez(PATH[0][1], PATH[1][1], PATH[2][1], PATH[3][1], uu);
        ctx.fillStyle = `rgba(232,115,26,${0.5 * (1 - k / 14)})`; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, 7); ctx.fill();
      }
      const shrink = lerp(1, 0.5, p(t, land - 0.4, 0.4));
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang * morph); ctx.scale(shrink * lerp(s0, 1, morph), shrink * lerp(s0, 1, morph) * (1 - 0.35 * Math.sin(Math.PI * u)));
      shadowed(ctx, () => {
        ctx.fillStyle = C.w; ctx.beginPath();
        PLANE.forEach((pt, i) => { const x = lerp(CARDPTS[i][0], pt[0], morph), y = lerp(CARDPTS[i][1], pt[1], morph); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fill();
      }, 18, 10, 0.25);
      ctx.strokeStyle = `rgba(232,115,26,${morph})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(60, 0); ctx.stroke();
      ctx.restore();
    }
  }
  stepLabel(ctx, t, 41.3, 4, 'Share with your team');
  const ta = p(t, 43.0, 0.3) * (1 - p(t, 45.0, 0.3));
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha *= ta;
    const s = 'Illustrative example', w = tw(ctx, s, 600, 24) + 40;
    ctx.fillStyle = 'rgba(31,42,36,0.75)'; rr(ctx, W - 60 - w, 56, w, 50, 25); ctx.fill();
    txt(ctx, s, W - 60 - w / 2, 89, { size: 24, weight: 600, color: C.w, align: 'center' });
    ctx.restore();
  }
}

// S10 47–52: the team uses it — one shared record.
function s10(ctx, t) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#E4F2E7';
  ctx.beginPath(); ctx.moveTo(1190, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(730, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.w; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(1190, 0); ctx.lineTo(730, H); ctx.stroke();
  const sales = [[47.8, 'Iced Latte', '2', 'KHQR', 5.0], [50.2, 'Hot Coffee', '3', 'Cash', 4.5]];
  const cur = t < 50.0 ? 0 : 1;
  const dots = [[47.9, 0.7, 0.3, 0.6, 0.4], [50.3, 0.4, 0.15, 0.35, 0.3]]; // start, leg1, sheet pause, leg2, grow
  // barista phone
  phone(ctx, 500, 560, 380, 740, -0.07, (c, sw, sh) => {
    c.fillStyle = '#F7F7F4'; c.fillRect(0, 0, sw, sh);
    c.fillStyle = C.dg; c.fillRect(0, 0, sw, 110);
    txt(c, 'New sale', 30, 80, { size: 32, weight: 700, color: C.w });
    const [, it, q, pay] = sales[cur];
    const sw2 = cur === 1 ? eo(p(t, 49.95, 0.25)) : 1;
    c.save(); c.globalAlpha *= sw2;
    field(c, 26, 130, sw - 52, 'Item', it, { vs: 28 });
    field(c, 26, 240, sw - 52, 'Quantity', q, { vs: 28 });
    txt(c, 'Payment', 26, 376, { size: 24, weight: 600, color: C.grey });
    ['Cash', 'KHQR'].forEach((s, j) => {
      const on = s === pay;
      c.fillStyle = on ? C.or : C.w; rr(c, 26 + j * 160, 394, 146, 50, 25); c.fill();
      c.strokeStyle = C.or; c.lineWidth = 3; rr(c, 26 + j * 160, 394, 146, 50, 25); c.stroke();
      txt(c, s, 26 + j * 160 + 73, 428, { size: 24, weight: 600, color: on ? C.w : C.or, align: 'center' });
    });
    c.restore();
    const st = sales[cur][0];
    const pr = t > st && t < st + 0.18 ? 0.92 : 1;
    c.save(); c.translate(sw / 2, sh - 110); c.scale(pr, pr);
    c.fillStyle = C.or; rr(c, -(sw - 52) / 2, -36, sw - 52, 72, 36); c.fill();
    txt(c, 'Save', 0, 12, { size: 32, weight: 700, color: C.w, align: 'center' });
    c.restore();
  });
  txt(ctx, 'Staff phone', 500, 990, { size: 26, weight: 600, color: C.grey, align: 'center' });
  // owner phone
  const added = sales.reduce((a, s, i) => a + (t >= dots[i][0] + dots[i][1] + dots[i][2] + dots[i][3] ? s[4] : 0), 0);
  const total = 42 + added;
  phone(ctx, 1450, 470, 360, 700, 0.06, (c, sw, sh) => {
    c.fillStyle = '#F7F7F4'; c.fillRect(0, 0, sw, sh);
    c.fillStyle = C.dg; c.fillRect(0, 0, sw, 110);
    txt(c, 'Today', 30, 80, { size: 32, weight: 700, color: C.w });
    txt(c, 'Sales total', 30, 170, { size: 24, weight: 600, color: C.grey });
    const lastUp = t >= 51.0 ? 51.0 : t >= 49.2 ? 49.2 : -1;
    const fl = lastUp > 0 ? pop(t, lastUp, 0.3, 0.12) : 1;
    c.save(); c.translate(30, 240); c.scale(fl, fl);
    txt(c, money(total), 0, 0, { size: 66, weight: 800, color: lastUp > 0 && t < lastUp + 0.6 ? C.or : C.ink });
    c.restore();
    const hs = [0.35, 0.55, 0.7, 0.45, 0.6];
    const base = sh - 90;
    hs.forEach((h, i) => { c.fillStyle = C.fg; rr(c, 30 + i * 52, base - 260 * h, 38, 260 * h, 6); c.fill(); });
    const g1 = eo(p(t, dots[0][0] + dots[0][1] + dots[0][2] + dots[0][3], dots[0][4]));
    const g2 = eo(p(t, dots[1][0] + dots[1][1] + dots[1][2] + dots[1][3], dots[1][4]));
    const lh = 0.2 + 0.25 * g1 + 0.25 * g2;
    c.fillStyle = C.or; rr(c, 30 + 5 * 52, base - 260 * lh, 38, 260 * lh, 6); c.fill();
    c.strokeStyle = '#D5D0C6'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, base); c.lineTo(sw - 20, base); c.stroke();
    if (t >= 49.2) txt(c, 'Updated just now', 30, base + 50, { size: 22, weight: 500, color: C.grey, alpha: p(t, 49.2, 0.3) });
  });
  txt(ctx, "Owner's phone", 1450, 900, { size: 26, weight: 600, color: C.grey, align: 'center' });
  // shared sheet icon
  let sp = 1;
  dots.forEach(([st, l1, ps]) => { if (t >= st + l1 && t < st + l1 + ps + 0.2) sp = Math.max(sp, pop(t, st + l1, ps + 0.2, 0.14)); });
  ctx.save(); ctx.translate(960, 500); ctx.scale(sp, sp);
  shadowed(ctx, () => { ctx.fillStyle = C.dg; rr(ctx, -80, -80, 160, 160, 28); ctx.fill(); }, 30, 12, 0.25);
  ctx.strokeStyle = C.w; ctx.lineWidth = 6; rr(ctx, -46, -46, 92, 92, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-46, -15); ctx.lineTo(46, -15); ctx.moveTo(-46, 15); ctx.lineTo(46, 15); ctx.moveTo(-10, -46); ctx.lineTo(-10, 46); ctx.stroke();
  ctx.restore();
  txt(ctx, 'Shared sheet', 960, 640, { size: 30, weight: 700, color: C.dg, align: 'center' });
  // data dots
  dots.forEach(([st, l1, ps, l2]) => {
    const a = [520, 838], m = [960, 500], b = [1470, 640];
    let pos = null;
    const k1 = p(t, st, l1), k2 = p(t, st + l1 + ps, l2);
    if (t >= st && k1 < 1) { const u = eio(k1); pos = [lerp(a[0], m[0], u), lerp(a[1], m[1], u) - Math.sin(Math.PI * u) * 260]; }
    else if (k2 > 0 && k2 < 1) { const u = eio(k2); pos = [lerp(m[0], b[0], u), lerp(m[1], b[1], u) - Math.sin(Math.PI * u) * 180]; }
    if (pos) {
      ctx.fillStyle = 'rgba(232,115,26,0.25)'; ctx.beginPath(); ctx.arc(pos[0], pos[1], 30, 0, 7); ctx.fill();
      ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(pos[0], pos[1], 16, 0, 7); ctx.fill();
    }
  });
  stepLabel(ctx, t, 47.2, 0, 'One shared record');
}

// S11 52–56: the evening — notebook goes on the shelf.
function s11(ctx, t) {
  ctx.save();
  camera(ctx, 960, 540, lerp(1.05, 1, eo(p(t, 52, 3.4))));
  cafeWall(ctx, t, { night: true });
  windowPane(ctx, 60, 150, 380, 410, true, t - 50);
  clock(ctx, 600, 270, 66, 8, 0);
  lamp(ctx, 800, 80, true);
  // shelf
  ctx.fillStyle = C.woodD; ctx.fillRect(1180, 430, 480, 22);
  ctx.fillStyle = C.w; rr(ctx, 1210, 330, 70, 100, 10); ctx.fill(); ctx.fillStyle = C.dg; ctx.fillRect(1210, 330, 70, 20);
  ctx.fillStyle = C.w; rr(ctx, 1500, 350, 60, 80, 10); ctx.fill(); ctx.fillStyle = C.fg; ctx.fillRect(1500, 350, 60, 18);
  plant(ctx, 1600, 430, 0.5);
  // notebook motion: counter → shelf
  const mv = eio(p(t, 52.25, 0.8));
  const nx = lerp(900, 1360, mv), ny = lerp(700, 320, mv) - Math.sin(Math.PI * mv) * 90 + (t > 53.05 ? 4 * Math.sin(Math.PI * p(t, 53.05, 0.2)) : 0);
  const nw = lerp(250, 66, mv), nh = lerp(36, 220, mv);
  // owner
  const reach = mv < 1 ? Math.min(1, 1 - p(t, 52.8, 0.3)) : 0;
  const phoneUp = eio(p(t, 53.4, 0.45));
  const handR = reach > 0 ? [lerp(95, clamp(nx - 820, 60, 190), reach), lerp(-14, clamp(ny - 720, -300, -14), reach)] : [lerp(95, 40, phoneUp), lerp(-14, -150, phoneUp)];
  person(ctx, 820, 720, 1, { hairStyle: 'bun', earring: true, eyes: t > 53.7 ? 'happy' : 'open', mouth: 'smile', arms: [{ side: 1, hand: handR }, { side: -1, hand: [lerp(-95, -40, phoneUp), lerp(-14, -150, phoneUp)] }] });
  counter(ctx, 720);
  if (phoneUp > 0) {
    phone(ctx, 820, 560 + (1 - phoneUp) * 140, 100, 180, 0, (c, sw, sh) => {
      c.fillStyle = '#F7F7F4'; c.fillRect(0, 0, sw, sh);
      c.fillStyle = C.dg; c.fillRect(0, 0, sw, 30);
      [0.4, 0.6, 0.5, 0.8].forEach((h, i) => { c.fillStyle = i === 3 ? C.or : C.fg; c.fillRect(10 + i * 19, sh - 20 - 90 * h, 13, 90 * h); });
    }, p(t, 53.7, 0.4));
  }
  // notebook
  const swing = ei(p(t, 55.35, 0.5));
  if (swing <= 0) {
    ctx.save(); ctx.translate(nx, ny);
    shadowed(ctx, () => { ctx.fillStyle = C.or; rr(ctx, -nw / 2, -nh / 2, nw, nh, 8); ctx.fill(); }, 14, 6, 0.2);
    ctx.fillStyle = C.orD; ctx.fillRect(-nw / 2, -nh / 2, Math.min(14, nw * 0.2), nh);
    ctx.restore();
  }
  ctx.restore();
  wordsUp(ctx, 'Less copying. Clearer numbers.', 960, 120, t, 52.4, { size: 66, weight: 800 });
  // cover swings toward camera and fills the frame
  if (swing > 0) {
    const x0 = 1327, y0 = 210, w0 = 66, h0 = 220;
    const x = lerp(x0, -100, swing), y = lerp(y0, -100, swing), w = lerp(w0, W + 200, swing), h = lerp(h0, H + 200, swing);
    const col = p(t, 55.8, 0.2);
    ctx.fillStyle = col > 0 ? mix(C.or, C.dg, col) : C.or;
    ctx.fillRect(x, y, w, h);
  }
}
function mix(a, b, k) {
  const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
}

// S12 56–60: brand close.
function s12(ctx, t) {
  ctx.fillStyle = C.dg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(960, 480, 50, 960, 480, 900);
  g.addColorStop(0, 'rgba(60,181,74,0.35)'); g.addColorStop(1, 'rgba(60,181,74,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const words = ['Describe', 'Build', 'Test', 'Deploy'];
  const size = 62, gap = 90;
  const ws = words.map(w => tw(ctx, w, 700, size));
  const total = ws.reduce((a, b) => a + b, 0) + gap * 3 + 40 * 4;
  let x = 960 - total / 2;
  const merge = eio(p(t, 57.5, 0.6));
  const wa = 1 - p(t, 57.45, 0.35);
  words.forEach((w, i) => {
    const k = eo(p(t, 56.15 + i * 0.24, 0.4));
    const dx = x + 14, dy = 520;
    const mx = lerp(dx, 960, merge), my = lerp(dy, 420, merge);
    if (k > 0 && merge < 1) {
      ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(mx, my + (1 - k) * 24, 14 * k, 0, 7); ctx.fill();
    }
    txt(ctx, w, x + 40, 542 + (1 - k) * 24, { size, weight: 700, color: C.w, alpha: k * wa });
    x += 40 + ws[i] + gap;
  });
  const lk = p(t, 58.0, 0.5);
  if (lk > 0) {
    const s = back(lk, 1.2);
    ctx.save(); ctx.translate(960, 440); ctx.scale(s, s);
    const a = tw(ctx, 'AI', 800, 120), b = tw(ctx, ' For Business', 800, 120);
    const sx = -(a + b) / 2;
    txt(ctx, 'AI', sx, 40, { size: 120, weight: 800, color: C.or });
    txt(ctx, ' For Business', sx + a, 40, { size: 120, weight: 800, color: C.w });
    ctx.restore();
  }
  const sk = eo(p(t, 58.45, 0.45));
  if (sk > 0) {
    ctx.fillStyle = C.or; ctx.fillRect(960 - 160 * sk, 540, 320 * sk, 6);
    txt(ctx, 'Build and Deploy with AI', 960, 630 + (1 - sk) * 20, { size: 52, weight: 600, color: C.w, align: 'center', alpha: sk });
  }
}

// =====================================================================
// timeline + transitions
// =====================================================================
const SCENES = [[0, 3, s1], [3, 7, s2], [7, 11, s3], [11, 15, s4], [15, 22, s5], [22, 30, s6], [30, 37, s7], [37, 41, s8], [41, 47, s9], [47, 52, s10], [52, 56, s11], [56, 1e9, s12]];
const off = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
function renderTo(i, fn, t) { const g = off[i].getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; fn(g, t); return off[i]; }
function crossfade(ctx, t, A, B, t0, d) {
  A(ctx, t);
  const k = eio(p(t, t0, d));
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(renderTo(0, B, t), 0, 0); ctx.restore();
}
function slide(ctx, t, A, B, t0, d, blur) {
  const q = eio(p(t, t0, d));
  const a = renderTo(0, A, t), b = renderTo(1, B, t);
  const g = off[2].getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.drawImage(a, -q * W, 0); g.drawImage(b, (1 - q) * W, 0);
  const L = blur * Math.sin(Math.PI * q);
  const N = L > 4 ? 8 : 1;
  for (let k = 0; k < N; k++) {
    ctx.globalAlpha = 1 / (k + 1);
    ctx.drawImage(off[2], N > 1 ? -L / 2 + (L * k) / (N - 1) : 0, 0);
  }
  ctx.globalAlpha = 1;
}
function zoomCross(ctx, t, A, B, t0, d, zx, zy) {
  const q = eio(p(t, t0, d));
  ctx.save(); camera(ctx, zx, zy, 1 + 0.6 * q); A(ctx, t); ctx.restore();
  ctx.save(); ctx.globalAlpha = q; camera(ctx, 960, 540, 1.12 - 0.12 * q); ctx.drawImage(renderTo(0, B, t), 0, 0); ctx.restore();
}
function drawFrame(ctx, t) {
  if (t >= 2.8 && t < 3.0) return crossfade(ctx, t, s1, s2, 2.8, 0.2);
  if (t >= 6.76 && t < 7.24) return slide(ctx, t, s2, s3, 6.76, 0.48, 260);
  if (t >= 10.75 && t < 11.0) return crossfade(ctx, t, s3, s4, 10.75, 0.25);
  if (t >= 14.4 && t < 15.0) {
    s4(ctx, t, true);
    ctx.save(); ctx.globalAlpha = eio(p(t, 14.4, 0.6)); ctx.drawImage(renderTo(0, s5, t), 0, 0); ctx.restore();
    return s4Head(ctx, t);
  }
  if (t >= 15.0 && t < 15.2) { s5(ctx, t); return s4Head(ctx, t); }
  if (t >= 29.6 && t < 30.4) return slide(ctx, t, s6, s7, 29.6, 0.8, 50);
  if (t >= 36.6 && t < 37.0) return zoomCross(ctx, t, s7, s8, 36.6, 0.4, 620, 500);
  if (t >= 46.6 && t < 47.0) return zoomCross(ctx, t, s9, s10, 46.6, 0.4, 1398, 590);
  const sc = SCENES.find(([a, b]) => t >= a && t < b);
  sc[2](ctx, t);
}

// ---------- captions (narration) ----------
const CAPTIONS = [
  [0.3, 2.9, 'Every night… the same notebook.'],
  [3.1, 6.9, 'Sales on paper. Stock lists in chat. Totals on a calculator.'],
  [7.2, 10.8, 'It works — until the business grows.'],
  [11.1, 14.9, 'So what if this page could become a tool your whole team uses?'],
  [15.2, 18.4, 'Start by describing what you need, in plain words.'],
  [18.5, 21.8, 'That is your prompt.'],
  [22.2, 25.2, 'AI tools like ChatGPT, Claude, Gemini or Copilot'],
  [25.3, 27.6, 'can help you build a first version:'],
  [27.7, 29.8, 'a form, a table, a daily summary.'],
  [30.2, 36.8, 'Then you test it. Enter real examples. Check every total.'],
  [37.2, 40.8, 'Something missing? Ask AI to add it.'],
  [41.2, 46.8, 'When it works, share it with your team.'],
  [47.2, 51.8, 'Every sale goes into one shared record.'],
  [52.2, 55.8, 'Less copying. Clearer numbers. More time to run the business.'],
  [56.3, 59.8, 'Build and deploy with AI. AI For Business.', true],
];
function drawCaptions(ctx, t) {
  const c = CAPTIONS.find(([a, b]) => t >= a && t < b);
  if (!c || c[3]) return;
  const a = Math.min(p(t, c[0], 0.15), 1 - p(t, c[1] - 0.15, 0.15));
  const size = 40, maxW = 1500;
  ctx.save(); ctx.font = font(600, size);
  const words = c[2].split(' '), lines = [];
  let cur = '';
  words.forEach(w => { const s = cur ? cur + ' ' + w : w; if (ctx.measureText(s).width > maxW && cur) { lines.push(cur); cur = w; } else cur = s; });
  lines.push(cur);
  ctx.globalAlpha = a;
  lines.forEach((ln, i) => {
    const y = H - 62 - (lines.length - 1 - i) * 62;
    const w = ctx.measureText(ln).width + 44;
    ctx.fillStyle = 'rgba(31,42,36,0.80)'; rr(ctx, 960 - w / 2, y - 44, w, 60, 14); ctx.fill();
    ctx.fillStyle = C.w; ctx.textAlign = 'center'; ctx.fillText(ln, 960, y - 2);
  });
  ctx.restore();
}

// ---------- entry points ----------
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
function render(t, opts = {}) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);
  drawFrame(ctx, Math.min(t, DUR - 0.001));
  if (opts.captions !== false) drawCaptions(ctx, t);
}
window.render = render;
window.drawCaptionsOnly = t => drawCaptions(ctx, t);
window.fontsReady = Promise.all([
  '400 40px Poppins', '600 40px Poppins', '700 40px Poppins', '800 40px Poppins', '700 40px Caveat', '400 40px Caveat',
].map(f => document.fonts.load(f)).concat([document.fonts.load('700 40px Battambang', 'កាហ្វេ')]));

// Live preview when opened in a browser (add ?t=12.5 to show one frame).
const qs = new URLSearchParams(location.search);
if (!qs.has('render')) {
  window.fontsReady.then(() => {
    if (qs.has('t')) { render(parseFloat(qs.get('t'))); return; }
    const start = performance.now();
    (function loop() { render(((performance.now() - start) / 1000) % DUR); requestAnimationFrame(loop); })();
  });
}
