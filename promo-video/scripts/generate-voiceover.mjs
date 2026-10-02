// Creates the Khmer voiceover with Gemini text-to-speech.
// Each script line from src/config.ts is spoken separately, so every scene and
// its karaoke captions line up exactly with the voice.
//
// Usage (the API key is read from the environment, never saved):
//   GEMINI_API_KEY=your-key npm run voice
//   GEMINI_API_KEY=your-key npm run voice -- --force   (re-record every line)
//   GEMINI_API_KEY=your-key npm run voice -- --redo=billing,moreTools   (new take of some lines)
//
// Output: public/voiceover.mp3 and src/generated/voice-timing.json
// Lines that did not change are reused from public/voice-lines/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = path.join(root, 'public');
const linesDir = path.join(pub, 'voice-lines');
fs.mkdirSync(linesDir, {recursive: true});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Set GEMINI_API_KEY first, e.g.  GEMINI_API_KEY=your-key npm run voice');
  process.exit(1);
}
const force = process.argv.includes('--force');
const redo = (process.argv.find((a) => a.startsWith('--redo=')) ?? '').slice(7).split(',').filter(Boolean);

// Read settings and script lines from config.ts.
const src = fs.readFileSync(path.join(root, 'src', 'config.ts'), 'utf8');
const voiceBlock = src.slice(src.indexOf('voice: {'));
const pick = (re, fallback) => (voiceBlock.match(re) ?? [])[1] ?? fallback;
const model = pick(/model:\s*'([^']+)'/, 'gemini-3.8-flash-tts');
const voiceName = pick(/voiceName:\s*'([^']+)'/, 'Kore');
const speed = Number(pick(/speed:\s*([\d.]+)/, '1'));
const gap = Number(pick(/gap:\s*([\d.]+)/, '0.35'));

const lineSpeed = Object.fromEntries(
  [...((voiceBlock.match(/lineSpeed:\s*\{([^}]*)\}/) ?? [])[1] ?? '').matchAll(/(\w+):\s*([\d.]+)/g)].map((m) => [m[1], Number(m[2])]),
);
const spoken = Object.fromEntries(
  [...((voiceBlock.match(/spoken:\s*\{([\s\S]*?)\n\s*\},/) ?? [])[1] ?? '').matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]]),
);

const voBlock = src.slice(src.indexOf('voiceover: {'));
const keys = ['hook', 'title', 'useAI', 'stock', 'billing', 'leave', 'agent', 'moreTools', 'offer', 'close'];
const lines = keys.map((k) => {
  const m = voBlock.match(new RegExp(`\\b${k}:\\s*'([^']*)'`));
  if (!m) throw new Error(`Voiceover line "${k}" not found in config.ts`);
  // "|" only guides caption word breaks; remove it for speech.
  return (spoken[k] ?? m[1]).replace(/\|/g, '');
});

const ffmpeg = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
const duration = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const tts = async (text) => {
  const body = {
    contents: [{parts: [{text}]}],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName}}},
    },
  };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {'x-goog-api-key': apiKey, 'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (res.ok && part) return {data: Buffer.from(part.inlineData.data, 'base64'), mime: part.inlineData.mimeType};
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    if (attempt === 4 || (res.status >= 400 && res.status < 500 && res.status !== 429)) throw new Error(msg);
    await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1)));
  }
};

const manifestPath = path.join(linesDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

const clips = [];
for (const [i, key] of keys.entries()) {
  const text = lines[i];
  const hash = crypto.createHash('sha1').update(`${model}|${voiceName}|${text}`).digest('hex').slice(0, 12);
  const raw = path.join(linesDir, `${key}.raw.wav`);
  if (force || redo.includes(key) || manifest[key] !== hash || !fs.existsSync(raw)) {
    process.stdout.write(`Recording ${key.padEnd(10)} ... `);
    const {data, mime} = await tts(text);
    if (/wav/i.test(mime) && data.subarray(0, 4).toString() === 'RIFF') {
      fs.writeFileSync(raw, data);
    } else {
      // Raw 16-bit PCM (24 kHz mono) → WAV.
      const pcm = path.join(linesDir, `${key}.pcm`);
      fs.writeFileSync(pcm, data);
      ffmpeg(['-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, raw]);
      fs.rmSync(pcm);
    }
    manifest[key] = hash;
    console.log('done');
  } else {
    console.log(`Reusing   ${key}`);
  }

  // Trim silence at both ends, apply speed, normalise to 48 kHz.
  const clean = path.join(linesDir, `${key}.wav`);
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05';
  const sp = lineSpeed[key] ?? speed;
  const filters = [trim, 'areverse', trim, 'areverse', ...(sp !== 1 ? [`atempo=${sp}`] : []), 'aresample=48000'];
  ffmpeg(['-i', raw, '-af', filters.join(','), '-ac', '1', clean]);
  clips.push({key, file: clean, length: duration(clean)});
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// Join lines with short pauses and record exact timing.
const lead = 0.3;
const silence = path.join(linesDir, 'gap.wav');
const head = path.join(linesDir, 'lead.wav');
ffmpeg(['-f', 'lavfi', '-t', String(gap), '-i', 'anullsrc=r=48000:cl=mono', silence]);
ffmpeg(['-f', 'lavfi', '-t', String(lead), '-i', 'anullsrc=r=48000:cl=mono', head]);

const list = [head];
const segments = [];
let t = lead;
clips.forEach((c, i) => {
  segments.push({key: c.key, start: Number(t.toFixed(3)), end: Number((t + c.length).toFixed(3))});
  t += c.length;
  list.push(c.file);
  if (i < clips.length - 1) {
    list.push(silence);
    t += gap;
  }
});
const listFile = path.join(linesDir, 'concat.txt');
fs.writeFileSync(listFile, list.map((f) => `file '${f}'`).join('\n'));
const out = path.join(pub, 'voiceover.mp3');
ffmpeg(['-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'libmp3lame', '-b:a', '192k', out]);
fs.rmSync(listFile);

const total = duration(out);
fs.mkdirSync(path.join(root, 'src', 'generated'), {recursive: true});
fs.writeFileSync(
  path.join(root, 'src', 'generated', 'voice-timing.json'),
  JSON.stringify({source: 'voiceover.mp3', generatedBy: `gemini:${model}:${voiceName}`, duration: total, segments}, null, 2) + '\n',
);

console.log('\nScene      start    end   length');
for (const s of segments) {
  console.log(`${s.key.padEnd(10)} ${s.start.toFixed(2).padStart(6)} ${s.end.toFixed(2).padStart(6)} ${(s.end - s.start).toFixed(2).padStart(6)}`);
}
console.log(`\nSaved public/voiceover.mp3 (${total.toFixed(2)} s, voice ${voiceName}, speed ${speed}).`);
console.log('Timing saved to src/generated/voice-timing.json. Now run: npm run render');

// Refresh the asset list so the video picks up the new voiceover.
execFileSync('node', [path.join(root, 'scripts', 'check-assets.mjs')], {stdio: 'inherit'});
