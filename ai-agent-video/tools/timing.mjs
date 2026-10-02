// Builds content/timing.json from content/script.json and the measured
// duration of each voice line (assets/audio/voice/<id>.wav). Lines with no
// audio yet get an estimate so the visuals can be developed before TTS runs.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = Number(process.env.TARGET_SECONDS || 60);

const script = JSON.parse(readFileSync(join(ROOT, "content/script.json"), "utf8"));

function probe(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ]).toString().trim();
  return Number(out);
}

// Khmer narration from Gemini TTS runs at roughly 13-15 characters per second.
const estimate = (text) => Math.max(1.2, [...text].length / 14);

const lines = script.lines.map((l) => {
  const wav = join(ROOT, "assets/audio/voice", `${l.id}.wav`);
  const measured = existsSync(wav);
  return { ...l, dur: measured ? probe(wav) : estimate(l.text), measured };
});

const LEAD = 0.9;          // music breathes before the first word
const TAIL = 3.6;          // end card after the last word
const gapAfter = (i) => {
  const a = lines[i], b = lines[i + 1];
  if (!b) return 0;
  if (a.id === "L01") return 0.55;          // beat before "That is an AI Agent"
  if (a.scene !== b.scene) return 0.95;     // scene transition
  if (a.scene === "loop") return 0.5;       // let each loop step land
  return 0.35;
};

const voiceTotal = lines.reduce((s, l) => s + l.dur, 0);
const baseGaps = lines.map((_, i) => gapAfter(i));
const gapTotal = baseGaps.reduce((s, g) => s + g, 0);
// Stretch or squeeze the pauses (within taste limits) to land near TARGET.
const room = TARGET - LEAD - TAIL - voiceTotal;
const scale = Math.min(1.6, Math.max(0.62, room / gapTotal));

let cursor = LEAD;
const outLines = {};
lines.forEach((l, i) => {
  outLines[l.id] = { start: +cursor.toFixed(3), dur: +l.dur.toFixed(3), scene: l.scene, measured: l.measured };
  cursor += l.dur + baseGaps[i] * scale;
});
const lastEnd = cursor;
const total = +(lastEnd + TAIL).toFixed(2);

const order = [...new Set(lines.map((l) => l.scene))];
const scenes = {};
order.forEach((name, i) => {
  const first = lines.find((l) => l.scene === name);
  const start = i === 0 ? 0 : outLines[first.id].start - 0.5;
  scenes[name] = { start: +start.toFixed(3) };
});
order.forEach((name, i) => {
  const next = order[i + 1];
  const end = next ? scenes[next].start + 0.55 : total; // overlap for the transition
  scenes[name].end = +end.toFixed(3);
  scenes[name].dur = +(end - scenes[name].start).toFixed(3);
});

const lastLine = lines[lines.length - 1];
const endcard = +(outLines[lastLine.id].start + lastLine.dur + 0.55).toFixed(3);

const timing = { total, endcard, gapScale: +scale.toFixed(3), voiceTotal: +voiceTotal.toFixed(2), scenes, lines: outLines };
writeFileSync(join(ROOT, "content/timing.json"), JSON.stringify(timing, null, 2));
const est = lines.filter((l) => !l.measured).length;
console.log(`timing: total ${total}s, voice ${voiceTotal.toFixed(1)}s, gap scale ${scale.toFixed(2)}${est ? `, ${est} line(s) estimated` : ""}`);
