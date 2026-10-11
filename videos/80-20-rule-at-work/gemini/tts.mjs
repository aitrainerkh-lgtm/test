// Gemini TTS, cached by text + voice + model. One call per scene keeps within free-tier daily limits.
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { p, VOICE, withRetry } from './lib.mjs';

export const SAMPLE_RATE = 24000;
// Speaking speed applied to each line (pitch is kept). 1.2 = 20% faster than the model's natural pace.
export const TEMPO = Number(process.env.VOICE_TEMPO || 1.2);
// No style instruction by default: the TTS model was found reading it aloud (in Khmer).
const STYLE = process.env.GEMINI_TTS_STYLE ?? '';

export function audioDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(String(out).trim());
}

// Returns { file, duration } for a mono 24 kHz WAV with leading and trailing silence trimmed.
export async function synthesize(ai, model, text) {
  const key = crypto.createHash('sha256').update(['v2', model, VOICE, STYLE, text].join('\n')).digest('hex').slice(0, 16);
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
    // Gemini appends a C2PA content-credentials manifest to the PCM; played as audio it is a loud click.
    let pcm = Buffer.from(part.inlineData.data, 'base64');
    const c2pa = pcm.indexOf('C2PA');
    if (c2pa > 0) pcm = pcm.subarray(0, c2pa - (c2pa % 2));
    fs.writeFileSync(raw, pcm);
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
  const log = spawnSync('ffmpeg', ['-nostats', '-i', whole.file, '-af', 'silencedetect=noise=-38dB:d=0.15', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const silStart = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const silEnd = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const gaps = silStart.map((s, i) => ({ mid: (s + (silEnd[i] ?? s)) / 2, len: (silEnd[i] ?? s) - s })).filter((g) => g.len > 0);

  // Where each line starts: Gemini listens to the scene and marks the starts, then each
  // cut snaps to the nearest real pause. Falls back to text length if that fails.
  const starts = await lineStarts(ai, whole, texts);
  const cuts = [];
  let floor = 0;
  for (let i = 1; i < texts.length; i++) {
    const want = starts[i];
    const near = gaps.filter((g) => g.mid > floor + 0.3 && Math.abs(g.mid - want) < 0.7);
    const pick = near.sort((a, b) => Math.abs(a.mid - want) - Math.abs(b.mid - want))[0];
    const at = Math.max(floor + 0.3, pick ? pick.mid : want - 0.05);
    cuts.push(at);
    floor = at;
  }
  const bounds = [0, ...cuts, whole.duration];
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03';
  return texts.map((_, i) => {
    const file = whole.file.replace(/\.wav$/, `.seg${i}.a3.t${TEMPO}.wav`);
    if (!fs.existsSync(file)) {
      // Trim, speed up, then fade the edges so no cut can click.
      const fades = 'afade=t=in:d=0.012,areverse,afade=t=in:d=0.045,areverse';
      // Cut on the input timeline (before the speed change), then filter.
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(bounds[i]), '-to', String(bounds[i + 1]), '-i', whole.file,
        '-af', `${trim},areverse,${trim},areverse,atempo=${TEMPO},${fades}`, '-c:a', 'pcm_s16le', file]);
    }
    return { file, duration: audioDuration(file) };
  });
}

// Asks Gemini (audio understanding) for the start time of each line in a scene recording.
async function lineStarts(ai, whole, texts) {
  const cache = whole.file.replace(/\.wav$/, '.starts.json');
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const lens = texts.map((t) => [...t.replace(/\s/g, '')].length);
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  const byLength = lens.map((l) => { const at = (acc / total) * whole.duration; acc += l; return at; });
  try {
    const res = await withRetry('align', () => ai.models.generateContent({
      model: process.env.GEMINI_ALIGN_MODEL || 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [
        { text: `This Khmer narration (${whole.duration.toFixed(2)} s) reads these ${texts.length} lines in order:\n` +
          texts.map((t, i) => `${i + 1}. ${t}`).join('\n') +
          '\nReturn the time in seconds where each line starts being spoken (line 1 starts near 0).' },
        { inlineData: { mimeType: 'audio/wav', data: fs.readFileSync(whole.file).toString('base64') } },
      ] }],
      config: { responseMimeType: 'application/json', responseJsonSchema: { type: 'object', properties: { starts: { type: 'array', items: { type: 'number' } } }, required: ['starts'] } },
    }));
    const starts = JSON.parse(res.text).starts;
    const ok = starts.length === texts.length && starts.every((x, i) => x >= 0 && x < whole.duration && (!i || x > starts[i - 1]));
    if (!ok) throw new Error(`bad starts ${JSON.stringify(starts)}`);
    fs.writeFileSync(cache, JSON.stringify(starts));
    return starts;
  } catch (e) {
    console.warn(`  line alignment failed (${e.message.slice(0, 80)}); cutting by text length`);
    return byLength;
  }
}
