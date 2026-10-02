// Finds where each of the 10 voiceover lines starts and ends in
// public/voiceover.mp3 (by detecting the pauses between lines) and writes
// src/generated/voice-timing.json. Scenes and karaoke captions follow it.
//
// Usage:  npm run sync
//         npm run sync -- --noise=-32 --pause=0.30   (tune pause detection)
//
// You can also edit src/generated/voice-timing.json by hand
// (start/end in seconds for each line).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = path.join(root, 'public');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')),
);
const noise = Number(args.noise ?? -35);
const pause = Number(args.pause ?? 0.25);

const file = ['voiceover.mp3', 'voiceover.wav', 'voiceover.m4a'].find((f) =>
  fs.existsSync(path.join(pub, f)),
);
if (!file) {
  console.error('No public/voiceover.mp3 found. Add the file and run again.');
  process.exit(1);
}
const full = path.join(pub, file);

// Voice lines and scene order straight from config.ts.
const src = fs.readFileSync(path.join(root, 'src', 'config.ts'), 'utf8');
const voBlock = src.slice(src.indexOf('voiceover: {'));
const keys = ['hook', 'title', 'useAI', 'stock', 'billing', 'leave', 'agent', 'moreTools', 'offer', 'close'];
const lines = keys.map((k) => {
  const m = voBlock.match(new RegExp(`\\b${k}:\\s*'([^']*)'`));
  return m ? m[1] : '';
});

const duration = Number(
  execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', full])
    .toString()
    .trim(),
);

const log = spawnSync(
  'ffmpeg',
  ['-hide_banner', '-i', full, '-af', `silencedetect=noise=${noise}dB:d=${pause}`, '-f', 'null', '-'],
  {encoding: 'utf8'},
).stderr;

// Build speech segments = gaps between silences.
const silences = [];
let open = null;
for (const line of log.split('\n')) {
  const s = line.match(/silence_start: ([\d.]+)/);
  const e = line.match(/silence_end: ([\d.]+)/);
  if (s) open = Number(s[1]);
  if (e && open !== null) {
    silences.push([open, Number(e[1])]);
    open = null;
  }
}
if (open !== null) silences.push([open, duration]);

let speech = [];
let cursor = 0;
for (const [s, e] of silences) {
  if (s - cursor > 0.05) speech.push({start: cursor, end: s});
  cursor = e;
}
if (duration - cursor > 0.05) speech.push({start: cursor, end: duration});

const weight = (t) => [...t.replace(/\s|\|/g, '')].length || 1;
let segments;

if (speech.length >= lines.length) {
  // Merge across the shortest pauses until we have exactly one chunk per line.
  while (speech.length > lines.length) {
    let best = 0;
    let bestGap = Infinity;
    for (let i = 0; i < speech.length - 1; i++) {
      const gap = speech[i + 1].start - speech[i].end;
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    speech.splice(best, 2, {start: speech[best].start, end: speech[best + 1].end});
  }
  segments = speech;
  console.log('Matched each line to a pause in the voiceover.');
} else {
  // Not enough clear pauses: share the spoken time by line length.
  const start = speech[0]?.start ?? 0;
  const end = speech.at(-1)?.end ?? duration;
  const total = lines.reduce((a, l) => a + weight(l), 0);
  let t = start;
  segments = lines.map((l) => {
    const len = ((end - start) * weight(l)) / total;
    const seg = {start: t, end: t + len};
    t += len;
    return seg;
  });
  console.log(
    `Only ${speech.length} pauses found (need ${lines.length}). Timing was shared by line length.\n` +
      'Try: npm run sync -- --noise=-30 --pause=0.2   or edit src/generated/voice-timing.json by hand.',
  );
}

const out = {
  source: file,
  duration,
  segments: segments.map((s, i) => ({
    key: keys[i],
    start: Number(s.start.toFixed(3)),
    end: Number(s.end.toFixed(3)),
  })),
};
fs.mkdirSync(path.join(root, 'src', 'generated'), {recursive: true});
fs.writeFileSync(path.join(root, 'src', 'generated', 'voice-timing.json'), JSON.stringify(out, null, 2) + '\n');

console.log('\nScene   start    end');
for (const s of out.segments) {
  console.log(`${s.key.padEnd(10)} ${s.start.toFixed(2).padStart(6)} ${s.end.toFixed(2).padStart(6)}`);
}
console.log(`\nSaved src/generated/voice-timing.json (voiceover ${duration.toFixed(2)} s).`);
