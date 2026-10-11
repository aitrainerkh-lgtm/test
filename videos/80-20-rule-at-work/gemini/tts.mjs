// Gemini TTS: one call per narration segment, cached by text + voice + model.
import { execFileSync } from 'node:child_process';
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
