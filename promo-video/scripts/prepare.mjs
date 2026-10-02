// Checks which optional files exist in /public and, when voiceover.mp3 is present,
// measures it and finds the pauses between the 10 spoken lines.
// Writes the result to src/generated/assets.json (read by the video).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (...p) => path.join(root, 'public', ...p);
const LINES = 10;

const files = {
  logo: existsSync(pub('logo.png')),
  hook: existsSync(pub('hook.jpg')),
  qr: existsSync(pub('qr.png')),
  voiceover: existsSync(pub('voiceover.mp3')),
  music: existsSync(pub('music.mp3')),
  icons: Object.fromEntries(
    ['chatgpt', 'claude', 'gemini', 'copilot'].map((id) => [id, existsSync(pub('icons', `${id}.png`))]),
  ),
};

// Use system ffmpeg/ffprobe if installed, otherwise the copy bundled with Remotion.
const run = (tool, args) => {
  let r = spawnSync(tool, args, { encoding: 'utf8' });
  if (r.error) {
    r = spawnSync('npx', ['remotion', tool, ...args], { encoding: 'utf8', cwd: root, shell: process.platform === 'win32' });
  }
  return `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
};

let voiceover = { duration: null, segments: null };

if (files.voiceover) {
  const file = pub('voiceover.mp3');
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  const duration = parseFloat(probe.trim().split(/\s+/).find((x) => /^\d+(\.\d+)?$/.test(x)) ?? 'NaN');

  const sd = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'silencedetect=noise=-35dB:d=0.25', '-f', 'null', '-']);
  const starts = [...sd.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...sd.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const silences = starts.map((s, i) => [s, ends[i] ?? duration]);

  // Leading/trailing silence trims the speech; the 9 longest inner pauses split the 10 lines.
  let speechStart = 0;
  let speechEnd = duration;
  const inner = [];
  for (const [s, e] of silences) {
    if (s <= 0.05) speechStart = e;
    else if (e >= duration - 0.05) speechEnd = s;
    else inner.push([s, e]);
  }
  if (Number.isFinite(duration) && inner.length >= LINES - 1) {
    const cuts = [...inner].sort((a, b) => b[1] - b[0] - (a[1] - a[0])).slice(0, LINES - 1).sort((a, b) => a[0] - b[0]);
    const segments = [];
    let cursor = speechStart;
    for (const [s, e] of cuts) {
      segments.push([+cursor.toFixed(3), +s.toFixed(3)]);
      cursor = e;
    }
    segments.push([+cursor.toFixed(3), +speechEnd.toFixed(3)]);
    voiceover = { duration, segments };
    console.log(`voiceover.mp3: ${duration.toFixed(2)}s, ${LINES} spoken lines detected`);
  } else {
    voiceover = { duration: Number.isFinite(duration) ? duration : null, segments: null };
    console.log(
      `voiceover.mp3: ${Number.isFinite(duration) ? duration.toFixed(2) + 's' : 'length unknown'}, ` +
        `found ${inner.length} pauses (need ${LINES - 1}). Scenes will be stretched evenly. ` +
        'For exact sync, set voiceover.segments in src/config.ts.',
    );
  }
}

mkdirSync(path.join(root, 'src', 'generated'), { recursive: true });
writeFileSync(path.join(root, 'src', 'generated', 'assets.json'), JSON.stringify({ files, voiceover }, null, 2) + '\n');

const have = Object.entries(files)
  .filter(([k, v]) => k !== 'icons' && v)
  .map(([k]) => k);
console.log(`Assets found: ${have.length ? have.join(', ') : 'none (using built-in stand-ins)'}`);
