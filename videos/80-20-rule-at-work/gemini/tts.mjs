// Gemini TTS, cached by text + voice + model. One call per scene keeps within free-tier daily limits.
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { p, VOICE, withRetry } from './lib.mjs';

export const SAMPLE_RATE = 24000;
const STYLE = process.env.GEMINI_TTS_STYLE ?? 'Read this in a warm, clear and friendly voice, at a steady and natural pace, like an experienced Cambodian manager explaining something useful to the team:';

export function audioDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(String(out).trim());
}

// Returns { file, duration } for a mono 24 kHz WAV with leading and trailing silence trimmed.
export async function synthesize(ai, model, text) {
  const key = crypto.createHash('sha256').update([model, VOICE, STYLE, text].join('\n')).digest('hex').slice(0, 16);
  const dir = p('audio', 'cache');
  const file = `${dir}/${key}.wav`;
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    const res = await withRetry(`TTS ${key}`, () =>
      ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: STYLE ? `${STYLE}\n${text}` : text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    );
    const part = res.candidates?.[0]?.content?.parts?.find((x) => x.inlineData?.data);
    if (!part) throw new Error(`TTS returned no audio for: ${text.slice(0, 60)}`);
    const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || '')?.[1] || SAMPLE_RATE);
    const raw = `${dir}/${key}.pcm`;
    fs.writeFileSync(raw, Buffer.from(part.inlineData.data, 'base64'));
    const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05';
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', raw,
      '-af', `${trim},areverse,${trim},areverse`, '-ar', String(SAMPLE_RATE), '-ac', '1', '-c:a', 'pcm_s16le', file]);
    fs.rmSync(raw);
  }
  const duration = audioDuration(file);
  if (!(duration > 0.2)) {
    fs.rmSync(file, { force: true });
    throw new Error(`TTS audio is empty or silent for: ${text.slice(0, 60)}`);
  }
  return { file, duration };
}

// Joins clips and silences into one WAV: parts = [{ file } | { silence: seconds }].
export function joinWav(parts, outFile) {
  const chunks = parts.map((part) => {
    if (part.silence != null) return Buffer.alloc(Math.round(part.silence * SAMPLE_RATE) * 2);
    return execFileSync('ffmpeg', ['-v', 'error', '-i', part.file, '-f', 's16le', '-ar', String(SAMPLE_RATE), '-ac', '1', '-'], { maxBuffer: 1 << 28 });
  });
  const data = Buffer.concat(chunks);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(outFile, Buffer.concat([header, data]));
}

// Voices a whole scene in one call (segments read as separate paragraphs), then
// splits the audio at the pauses between segments. Returns [{ file, duration }] per segment.
export async function synthesizeScene(ai, model, texts) {
  const whole = await synthesize(ai, model, texts.join('\n\n'));
  if (texts.length === 1) return [whole];
  const log = spawnSync('ffmpeg', ['-nostats', '-i', whole.file, '-af', 'silencedetect=noise=-38dB:d=0.15', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const gaps = starts.map((s, i) => ({ mid: (s + (ends[i] ?? s)) / 2, len: (ends[i] ?? s) - s })).filter((g) => g.len > 0);

  // Expected cut points from text length; take the longest pause near each one, in order.
  const lens = texts.map((t) => [...t.replace(/\s/g, '')].length);
  const total = lens.reduce((a, b) => a + b, 0);
  const cuts = [];
  let acc = 0;
  let floor = 0;
  for (let i = 0; i < texts.length - 1; i++) {
    acc += lens[i];
    const expect = (acc / total) * whole.duration;
    const window = Math.max(1.5, whole.duration * 0.12);
    const near = gaps.filter((g) => g.mid > floor + 0.3 && Math.abs(g.mid - expect) < window);
    const pick = near.sort((a, b) => b.len - a.len || Math.abs(a.mid - expect) - Math.abs(b.mid - expect))[0];
    if (!pick) console.warn(`  no pause found near ${expect.toFixed(1)} s in ${whole.file}; cutting by text length`);
    const at = pick ? pick.mid : expect;
    cuts.push(at);
    floor = at;
  }
  const bounds = [0, ...cuts, whole.duration];
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03';
  return texts.map((_, i) => {
    const file = whole.file.replace(/\.wav$/, `.seg${i}.wav`);
    if (!fs.existsSync(file)) {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', whole.file, '-ss', String(bounds[i]), '-to', String(bounds[i + 1]),
        '-af', `${trim},areverse,${trim},areverse`, '-c:a', 'pcm_s16le', file]);
    }
    return { file, duration: audioDuration(file) };
  });
}
