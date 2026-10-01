// Generate the narration with Gemini TTS, one clip per script line.
//
//   GEMINI_API_KEY=... node tools/voice.mjs [--takes 2] [--model gemini-3.8-flash-tts] [--voice Charon]
//
// For every line it requests N takes, measures each (speech span, internal
// pauses), keeps the most natural one, trims it and writes vo/<line>.wav plus
// vo/manifest.json. `node tools/build.mjs` then retimes the whole film to it.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = JSON.parse(fs.readFileSync(path.join(ROOT, "script.json"), "utf8"));
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const TAKES = Number(arg("takes", 2));
const VOICE = arg("voice", script.voice.voice);
const ONLY = arg("only", null);
const MODELS = [arg("model", script.voice.model), "gemini-3.8-flash-tts", "gemini-2.5-pro-preview-tts", "gemini-2.5-flash-preview-tts"].filter(
  (m, i, a) => m && a.indexOf(m) === i
);
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!KEY) {
  console.error("Set GEMINI_API_KEY (or GOOGLE_API_KEY) to generate the narration.");
  process.exit(2);
}
const redact = (s) => String(s).split(KEY).join("[redacted]");
const VO = path.join(ROOT, "vo");
fs.mkdirSync(path.join(VO, "takes"), { recursive: true });

// ---------- Gemini ----------
async function synth(text, style, model) {
  const modern = model.startsWith("gemini-3.8-");
  const content = { type: "text", text: !modern && style ? `Read the following text with this delivery: ${style}\n\n${text}` : text };
  if (modern && style) content.annotations = [{ type: "speech_metadata", style }];
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model,
      input: [{ type: "user_input", content: [content] }],
      response_format: modern ? { type: "audio", mime_type: "audio/wav" } : { type: "audio" },
      generation_config: { speech_config: [{ voice: VOICE }] },
      store: false,
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${redact((await res.text()).slice(0, 400))}`), { status: res.status });
  const payload = await res.json();
  if (payload.status !== "completed") throw new Error(`did not complete (${payload.status})`);
  const audio = (payload.steps ?? []).filter((s) => s.type === "model_output").flatMap((s) => s.content ?? []).filter((p) => p.type === "audio");
  if (audio.length !== 1 || !audio[0].data) throw new Error("no single audio block");
  const bytes = Buffer.from(audio[0].data, "base64");
  const mime = audio[0].mime_type ?? "";
  if (/^audio\/l16/i.test(mime)) {
    const rate = Number(/rate=(\d+)/i.exec(mime)?.[1] ?? 24000);
    return { pcm: pcm16(bytes), rate };
  }
  return readWav(bytes);
}

function pcm16(buf) {
  const n = Math.floor(buf.length / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(i * 2) / 32768;
  return out;
}

function readWav(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF") throw new Error("not a WAV");
  let off = 12, rate = 24000, ch = 1, bits = 16, data = null;
  while (off < buf.length - 8) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") {
      ch = buf.readUInt16LE(off + 10);
      rate = buf.readUInt32LE(off + 12);
      bits = buf.readUInt16LE(off + 22);
    } else if (id === "data") data = buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  if (!data || bits !== 16) throw new Error("unsupported WAV");
  const all = pcm16(data);
  if (ch === 1) return { pcm: all, rate };
  const mono = new Float32Array(all.length / ch);
  for (let i = 0; i < mono.length; i++) {
    let s = 0;
    for (let c = 0; c < ch; c++) s += all[i * ch + c];
    mono[i] = s / ch;
  }
  return { pcm: mono, rate };
}

function writeWav(file, pcm, rate) {
  const b = Buffer.alloc(44 + pcm.length * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + pcm.length * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(pcm.length * 2, 40);
  for (let i = 0; i < pcm.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}

// ---------- analysis ----------
function analyse(pcm, rate) {
  const hop = Math.round(rate * 0.01);
  const frames = Math.floor(pcm.length / hop);
  const db = new Float32Array(frames);
  let peak = -120;
  for (let f = 0; f < frames; f++) {
    let s = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) s += pcm[i] * pcm[i];
    db[f] = 10 * Math.log10(s / hop + 1e-12);
    peak = Math.max(peak, db[f]);
  }
  const thr = peak - 38;
  let first = 0, last = frames - 1;
  while (first < frames && db[first] < thr) first++;
  while (last > 0 && db[last] < thr) last--;
  const silences = [];
  let run = -1;
  for (let f = first; f <= last; f++) {
    if (db[f] < peak - 30) {
      if (run < 0) run = f;
    } else if (run >= 0) {
      if (f - run >= 9) silences.push([run * 0.01, f * 0.01]);
      run = -1;
    }
  }
  return { start: first * 0.01, end: (last + 1) * 0.01, silences, peak };
}

const est = (t) => t.length / 15.0;
const clean = (t) => t.replace(/\[[a-z0-9_]+\]/gi, "");

// ---------- main ----------
const manifestPath = path.join(VO, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { lines: {} };
let model = MODELS[0];
for (const line of script.lines) {
  if (ONLY && !ONLY.split(",").includes(line.id)) continue;
  const text = clean(line.text);
  const style = [script.voice.style, line.direction].filter(Boolean).join(" ");
  const takes = [];
  for (let k = 0; k < TAKES; k++) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const { pcm, rate } = await synth(text, style, model);
        const a = analyse(pcm, rate);
        const dur = a.end - a.start;
        const longGap = a.silences.reduce((m, s) => Math.max(m, s[1] - s[0]), 0);
        // prefer natural pace near the estimate, penalise odd long pauses
        const score = Math.abs(Math.log(dur / est(text))) + Math.max(0, longGap - 0.7) * 2;
        writeWav(path.join(VO, "takes", `${line.id}-${k + 1}.wav`), pcm, rate);
        takes.push({ pcm, rate, a, dur, score, k });
        break;
      } catch (e) {
        const msg = redact(e.message);
        if ((e.status === 404 || e.status === 400) && MODELS.indexOf(model) < MODELS.length - 1 && /model/i.test(msg)) {
          model = MODELS[MODELS.indexOf(model) + 1];
          console.warn(`  model unavailable, falling back to ${model}`);
        } else {
          console.warn(`  ${line.id} take ${k + 1} attempt ${attempt + 1} failed: ${msg}`);
          await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
        }
      }
    }
  }
  if (!takes.length) throw new Error(`no audio for ${line.id}`);
  takes.sort((x, y) => x.score - y.score);
  const best = takes[0];
  const lead = 0.04, tail = 0.12;
  const s0 = Math.max(0, Math.round((best.a.start - lead) * best.rate));
  const s1 = Math.min(best.pcm.length, Math.round((best.a.end + tail) * best.rate));
  const out = best.pcm.slice(s0, s1);
  const fade = Math.round(best.rate * 0.02);
  for (let i = 0; i < fade; i++) {
    out[i] *= i / fade;
    out[out.length - 1 - i] *= i / fade;
  }
  const file = `${line.id}.wav`;
  writeWav(path.join(VO, file), out, best.rate);
  const shift = s0 / best.rate;
  manifest.lines[line.id] = {
    file,
    take: best.k + 1,
    model,
    voice: VOICE,
    duration: +(out.length / best.rate).toFixed(3),
    speechStart: +(best.a.start - shift).toFixed(3),
    speechEnd: +(best.a.end - shift).toFixed(3),
    silences: best.a.silences.map(([x, y]) => [+(x - shift).toFixed(3), +(y - shift).toFixed(3)]),
  };
  console.log(`${line.id}: take ${best.k + 1}/${takes.length} · ${best.dur.toFixed(2)}s (est ${est(text).toFixed(2)}s) · ${best.a.silences.length} pauses`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`narration ready (${model}, voice ${VOICE}). Next: node tools/build.mjs`);
