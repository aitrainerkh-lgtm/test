// Synthesises the sound effects into public/sfx/*.wav (no third-party audio,
// so there are no licence issues). Run again only if you change the sounds:
//   node scripts/make-sfx.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public', 'sfx');
fs.mkdirSync(outDir, {recursive: true});

const SR = 48000;
const TAU = Math.PI * 2;

// Deterministic noise so renders are repeatable.
let seed = 12345;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const noise = () => rnd() * 2 - 1;

const buf = (sec) => new Float32Array(Math.round(sec * SR));

const writeWav = (name, data, peakDb = -3) => {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? Math.pow(10, peakDb / 20) / peak : 1;
  // 3 ms fade-out to avoid clicks.
  const fade = Math.round(0.003 * SR);
  const pcm = Buffer.alloc(data.length * 2);
  data.forEach((v, i) => {
    const f = i > data.length - fade ? (data.length - i) / fade : 1;
    pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * gain * f * 32767))), i * 2);
  });
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(path.join(outDir, `${name}.wav`), Buffer.concat([h, pcm]));
};

// State-variable band-pass filter with a moving centre frequency.
const bandpass = (input, freqAt, q = 1.2) => {
  const out = new Float32Array(input.length);
  let low = 0;
  let band = 0;
  for (let i = 0; i < input.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(freqAt(i / SR), SR / 6)) / SR);
    low += f * band;
    const high = input[i] - low - band / q;
    band += f * high;
    out[i] = band;
  }
  return out;
};

const bell = (data, start, freq, dur, amp = 1) => {
  const s0 = Math.round(start * SR);
  for (let i = 0; i < dur * SR && s0 + i < data.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * (5 / dur)) * Math.min(1, t / 0.002);
    data[s0 + i] +=
      amp * env * (Math.sin(TAU * freq * t) + 0.35 * Math.sin(TAU * freq * 2.01 * t) + 0.12 * Math.sin(TAU * freq * 3.02 * t));
  }
};

// Scene transition whoosh.
{
  const d = 0.55;
  const n = buf(d).map(() => noise());
  const f = bandpass(n, (t) => 300 + 2600 * Math.sin((Math.PI * t) / d), 0.9);
  const out = f.map((v, i) => {
    const t = i / SR;
    return v * Math.pow(Math.sin((Math.PI * Math.min(t, d)) / d), 1.6);
  });
  writeWav('whoosh', out, -4);
}

// Short light swipe (carousel, highlight bar).
{
  const d = 0.28;
  const n = buf(d).map(() => noise());
  const f = bandpass(n, (t) => 1200 + 4000 * (t / d), 1.4);
  writeWav('swipe', f.map((v, i) => v * Math.sin((Math.PI * i) / (d * SR))), -6);
}

// Pop (UI elements appearing). Four pitches.
[520, 620, 740, 880].forEach((base, k) => {
  const d = 0.12;
  const out = buf(d);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const freq = base * (1.9 - 0.9 * Math.min(1, t / 0.05));
    ph += (TAU * freq) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 38) * Math.min(1, t / 0.001);
  }
  writeWav(`pop${k + 1}`, out, -3);
});

// Mouse click.
{
  const out = buf(0.06);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (noise() * 0.6 + Math.sin(TAU * 2400 * t) * 0.5) * Math.exp(-t * 160) + Math.sin(TAU * 900 * t) * Math.exp(-t * 90) * 0.4;
  }
  writeWav('click', out, -3);
}

// Keyboard typing bed (1.6 s of soft keys).
{
  const d = 1.6;
  const out = buf(d);
  let t = 0.01;
  while (t < d - 0.05) {
    const s0 = Math.round(t * SR);
    const pitch = 1800 + rnd() * 1600;
    const amp = 0.5 + rnd() * 0.5;
    for (let i = 0; i < 0.03 * SR && s0 + i < out.length; i++) {
      const tt = i / SR;
      out[s0 + i] += amp * (noise() * 0.7 + Math.sin(TAU * pitch * tt) * 0.3) * Math.exp(-tt * 220);
    }
    t += 0.055 + rnd() * 0.05;
  }
  writeWav('typing', bandpass(out, () => 3000, 0.8), -8);
}

// Chat message "bloop".
{
  const d = 0.16;
  const out = buf(d);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const freq = 520 + 700 * Math.min(1, t / 0.07);
    ph += (TAU * freq) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 22) * Math.min(1, t / 0.004);
  }
  writeWav('message', out, -3);
}

// Notification "ding-dong".
{
  const out = buf(0.9);
  bell(out, 0, 1318.5, 0.5, 1);
  bell(out, 0.12, 1975.5, 0.7, 0.8);
  writeWav('notify', out, -4);
}

// Success chime (rising arpeggio).
{
  const out = buf(0.9);
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(out, i * 0.06, f, 0.6, 0.8));
  writeWav('success', out, -4);
}

// Coin / cash register.
{
  const out = buf(0.8);
  bell(out, 0, 2093, 0.25, 0.7);
  bell(out, 0.07, 2637, 0.6, 1);
  bell(out, 0.07, 3951, 0.4, 0.35);
  const n = bandpass(buf(0.8).map(() => noise()), () => 6000, 2);
  for (let i = 0; i < 0.12 * SR; i++) out[i] += n[i] * 0.25 * Math.exp((-i / SR) * 30);
  writeWav('coin', out, -4);
}

// Receipt printer line.
{
  const d = 0.22;
  const out = buf(d);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const grain = Math.sin(TAU * 95 * t) > 0.6 ? 1 : 0;
    out[i] = (noise() * 0.6 * grain + Math.sign(Math.sin(TAU * 190 * t)) * 0.15) * Math.sin((Math.PI * t) / d);
  }
  writeWav('print', bandpass(out, () => 2200, 0.7), -7);
}

// Soft impact (big numbers, title).
{
  const d = 0.7;
  const out = buf(d);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const freq = 110 * Math.exp(-t * 4) + 42;
    ph += (TAU * freq) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 6) + noise() * Math.exp(-t * 60) * 0.3;
  }
  writeWav('impact', out, -3);
}

// Sparkle (bonus badge).
{
  const out = buf(1.0);
  for (let k = 0; k < 9; k++) bell(out, k * 0.07 + rnd() * 0.02, 2600 + rnd() * 2600, 0.35, 0.5 + rnd() * 0.4);
  writeWav('sparkle', out, -6);
}

// Riser before the title.
{
  const d = 0.8;
  const n = buf(d).map(() => noise());
  const f = bandpass(n, (t) => 400 + 5000 * Math.pow(t / d, 2), 1.5);
  writeWav('riser', f.map((v, i) => v * Math.pow(i / f.length, 2)), -6);
}

console.log('Sound effects written to public/sfx/');
