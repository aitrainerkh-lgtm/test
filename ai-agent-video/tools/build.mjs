// Build timing.json + index.html from script.json, the HTML template and
// (when present) the measured narration in vo/manifest.json.
//
//   node tools/build.mjs
//
// Every visual cue and every audio event is derived from one timing model, so
// re-voicing the film only needs a rebuild: no hand-retiming.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = JSON.parse(fs.readFileSync(path.join(ROOT, "script.json"), "utf8"));
const manifestPath = path.join(ROOT, "vo", "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;

// ---------- text helpers ----------
const CUE_RE = /\[([a-z0-9_]+)\]/gi;
const PAUSE = { ",": 0.2, ":": 0.26, ";": 0.26, ".": 0.34, "?": 0.36, "!": 0.34 };
const CHARS_PER_SEC = 15.0; // estimated speaking rate when no audio exists yet

function parseLine(raw) {
  const cues = [];
  let clean = "";
  let last = 0;
  raw.replace(CUE_RE, (m, id, idx) => {
    clean += raw.slice(last, idx);
    cues.push({ id, at: clean.length });
    last = idx + m.length;
    return m;
  });
  clean += raw.slice(last);
  return { clean, cues };
}

// Split the text into speech segments at internal punctuation.
function segmentsOf(clean) {
  const segs = [];
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (PAUSE[ch] !== undefined && i < clean.length - 1 && clean[i + 1] === " ") {
      segs.push({ from: start, to: i + 1, pauseAfter: PAUSE[ch] });
      start = i + 2;
    }
  }
  segs.push({ from: start, to: clean.length, pauseAfter: 0 });
  return segs;
}

// Map each segment to a [t0, t1] speech window inside the line (seconds from line start).
function segmentWindows(clean, segs, measured) {
  const est = segs.map((s) => (s.to - s.from) / CHARS_PER_SEC);
  if (!measured) {
    let t = 0;
    return segs.map((s, i) => {
      const w = [t, t + est[i]];
      t += est[i] + s.pauseAfter;
      return w;
    });
  }
  // Measured: speech spans from speechStart..speechEnd; internal silences (if
  // detected) anchor the segment seams, otherwise distribute proportionally.
  const { speechStart, speechEnd, silences = [] } = measured;
  const seams = segs.length - 1;
  const totalEst = est.reduce((a, b) => a + b, 0) + segs.slice(0, -1).reduce((a, s) => a + s.pauseAfter, 0);
  const scale = (speechEnd - speechStart) / totalEst;
  // estimated seam centres
  let t = speechStart;
  const seamEst = [];
  segs.forEach((s, i) => {
    t += est[i] * scale;
    if (i < seams) {
      seamEst.push(t + (s.pauseAfter * scale) / 2);
      t += s.pauseAfter * scale;
    }
  });
  const used = new Set();
  const seamWin = seamEst.map((c) => {
    let best = -1;
    let bestD = 0.6; // only snap to a silence within 0.6s of the estimate
    silences.forEach((sl, k) => {
      if (used.has(k)) return;
      const mid = (sl[0] + sl[1]) / 2;
      const d = Math.abs(mid - c);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    if (best >= 0) {
      used.add(best);
      return silences[best];
    }
    return [c, c];
  });
  const wins = [];
  let cur = speechStart;
  segs.forEach((s, i) => {
    const end = i < seams ? seamWin[i][0] : speechEnd;
    wins.push([cur, Math.max(cur + 0.05, end)]);
    if (i < seams) cur = seamWin[i][1];
  });
  return wins;
}

function timeAtChar(clean, segs, wins, at) {
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (at <= s.to || i === segs.length - 1) {
      const local = Math.min(Math.max(at - s.from, 0), s.to - s.from);
      // weight by characters but skip leading space
      const f = (s.to - s.from) > 0 ? local / (s.to - s.from) : 0;
      return wins[i][0] + f * (wins[i][1] - wins[i][0]);
    }
  }
  return 0;
}

// Caption phrases: split at punctuation, then cap phrase length at ~6 words.
function captionPhrases(clean, segs, wins) {
  const out = [];
  segs.forEach((s, i) => {
    const text = clean.slice(s.from, s.to).trim();
    const words = text.split(/\s+/);
    const chunks = [];
    if (words.length <= 7) chunks.push(words);
    else {
      const n = Math.ceil(words.length / 6);
      const per = Math.ceil(words.length / n);
      for (let k = 0; k < words.length; k += per) chunks.push(words.slice(k, k + per));
    }
    let charPos = s.from;
    chunks.forEach((c) => {
      const t = c.join(" ");
      const idx = clean.indexOf(c[0], charPos);
      const endIdx = idx + t.length;
      out.push({
        text: t,
        start: timeAtChar(clean, segs, wins, idx),
        end: timeAtChar(clean, segs, wins, endIdx),
      });
      charPos = endIdx;
    });
  });
  return out;
}

// ---------- build the line model ----------
const lines = script.lines.map((l) => {
  const { clean, cues } = parseLine(l.text);
  const segs = segmentsOf(clean);
  const m = manifest?.lines?.[l.id];
  const wins = segmentWindows(clean, segs, m);
  const duration = m ? m.duration : wins[wins.length - 1][1] + 0.12;
  return { id: l.id, gap: l.gap, clean, cues, segs, wins, duration, measured: !!m };
});

// Fit gaps so the film lands on the target duration.
const lead = script.vo_lead_in;
let endCard = script.end_card;
const speech = lines.reduce((a, l) => a + l.duration, 0);
const gapSum = lines.reduce((a, l) => a + l.gap, 0);
let natural = lead + speech + gapSum + endCard;
let gapScale = 1;
if (script.target_duration) {
  const diff = script.target_duration - natural;
  gapScale = Math.min(1.6, Math.max(0.8, (gapSum + diff) / gapSum));
  const afterGaps = lead + speech + gapSum * gapScale + endCard;
  endCard = Math.min(5.5, Math.max(2.8, endCard + (script.target_duration - afterGaps)));
}

let t = lead;
const timing = { lines: {}, cues: {}, captions: [], scenes: {}, total: 0, measured: !!manifest };
lines.forEach((l) => {
  const start = t;
  timing.lines[l.id] = { start, end: start + l.duration, duration: l.duration, text: l.clean };
  l.cues.forEach((c) => {
    timing.cues[`${l.id}.${c.id}`] = +(start + timeAtChar(l.clean, l.segs, l.wins, c.at)).toFixed(3);
  });
  timing.cues[`${l.id}.start`] = +start.toFixed(3);
  timing.cues[`${l.id}.end`] = +(start + l.wins[l.wins.length - 1][1]).toFixed(3);
  captionPhrases(l.clean, l.segs, l.wins).forEach((p) =>
    timing.captions.push({ text: p.text, start: +(start + p.start).toFixed(3), end: +(start + p.end).toFixed(3) })
  );
  t = start + l.duration + l.gap * gapScale;
});
const lastLine = lines[lines.length - 1];
const voEnd = timing.lines[lastLine.id].end;
timing.total = +(Math.round((voEnd + endCard) * 30) / 30).toFixed(3);
timing.cues["end.card"] = +(voEnd + 0.15).toFixed(3);

// Scenes: each starts a beat before its first line; neighbours overlap for transitions.
const SCENE_LEAD = 0.45;
const OVERLAP = 0.7;
script.scenes.forEach((s, i) => {
  const first = timing.lines[s.lines[0]];
  const start = i === 0 ? 0 : Math.max(0, first.start - SCENE_LEAD);
  timing.scenes[s.id] = { start: +start.toFixed(3) };
});
script.scenes.forEach((s, i) => {
  const next = script.scenes[i + 1];
  const end = next ? timing.scenes[next.id].start + OVERLAP : timing.total;
  timing.scenes[s.id].end = +Math.min(end, timing.total).toFixed(3);
  timing.scenes[s.id].duration = +(timing.scenes[s.id].end - timing.scenes[s.id].start).toFixed(3);
});

fs.writeFileSync(path.join(ROOT, "timing.json"), JSON.stringify(timing, null, 2));

// ---------- index.html from template ----------
const tpl = fs.readFileSync(path.join(ROOT, "src", "template.html"), "utf8");
const html = tpl
  .replace("/*TIMING_JSON*/", `window.TIMING = ${JSON.stringify(timing)};`)
  .replace(/\{\{total\}\}/g, String(timing.total))
  .replace(/\{\{(s\d)\.(start|duration)\}\}/g, (_, s, k) => String(timing.scenes[s][k]));
fs.writeFileSync(path.join(ROOT, "index.html"), html);

console.log(
  `timing: ${manifest ? "measured narration" : "ESTIMATED narration"} | total ${timing.total}s | gapScale ${gapScale.toFixed(2)} | end card ${endCard.toFixed(2)}s`
);
Object.entries(timing.scenes).forEach(([k, v]) => console.log(`  ${k}: ${v.start.toFixed(2)} → ${v.end.toFixed(2)}`));
