#!/usr/bin/env node
// Gemini production pipeline for the Khmer narration and the music.
//
//   node tools/gemini.mjs all      # script -> voice -> fit -> music
//   node tools/gemini.mjs script   # Khmer script + on-screen labels
//   node tools/gemini.mjs voice    # Gemini TTS for every line, with QA
//   node tools/gemini.mjs fit      # shorten lines if the read runs long
//   node tools/gemini.mjs music    # Lyria RealTime score
//
// Needs GEMINI_API_KEY (or GOOGLE_API_KEY). Optional overrides:
//   GEMINI_TEXT_MODEL, GEMINI_TTS_MODEL, VOICE (default Charon), MAX_VOICE (s)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LINES, LABELS, TOPIC, ENGLISH_TERMS } from "./brief.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "content/gemini");
const RAW = join(OUT, "raw");
const VOICE_DIR = join(ROOT, "assets/audio/voice");
for (const d of [OUT, RAW, VOICE_DIR]) mkdirSync(d, { recursive: true });

const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const VOICE = process.env.VOICE || "Charon";
const MAX_VOICE = Number(process.env.MAX_VOICE || 50.5);
const BASE = process.env.GEMINI_BASE || "https://generativelanguage.googleapis.com/v1beta";
const log = (...a) => console.log("[gemini]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2));
const redact = (s) => (KEY ? String(s).split(KEY).join("[redacted]") : String(s));

if (!KEY) {
  console.error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set. Add it to the environment and run again.");
  process.exit(2);
}

async function api(method, path, body, { timeout = 180_000, tries = 5 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${BASE}/${path}`, {
        method,
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeout),
      });
      const text = await res.text();
      if (res.ok) return JSON.parse(text);
      last = new Error(`HTTP ${res.status} ${path.split("?")[0]}: ${redact(text).slice(0, 600)}`);
      last.status = res.status;
      if (![408, 429, 500, 502, 503, 504].includes(res.status)) throw last;
    } catch (e) {
      last = e;
      if (e.status && ![408, 429, 500, 502, 503, 504].includes(e.status)) throw e;
    }
    const wait = 2000 * 2 ** i;
    log(`retry in ${wait / 1000}s: ${redact(last.message).slice(0, 160)}`);
    await sleep(wait);
  }
  throw last;
}

// ---------- model selection ----------
let MODELS;
async function models() {
  if (MODELS) return MODELS;
  const out = [];
  let token = "";
  do {
    const r = await api("GET", `models?pageSize=1000${token ? `&pageToken=${token}` : ""}`);
    out.push(...(r.models || []));
    token = r.nextPageToken || "";
  } while (token);
  MODELS = out.map((m) => ({ id: m.name.replace(/^models\//, ""), methods: m.supportedGenerationMethods || [] }));
  writeJson(join(OUT, "models.json"), MODELS.map((m) => m.id));
  return MODELS;
}
const version = (id) => Number((/gemini-(\d+(?:\.\d+)?)/.exec(id) || [])[1] || 0);

async function textModel({ fast = false } = {}) {
  if (process.env.GEMINI_TEXT_MODEL && !fast) return process.env.GEMINI_TEXT_MODEL;
  const ms = (await models()).filter((m) => m.methods.includes("generateContent") && /^gemini-\d/.test(m.id) &&
    !/(tts|image|audio|live|embedding|robotics|computer|transcribe|customtools|exp-\d{4})/.test(m.id));
  const score = (id) => version(id) * 10 + (fast ? (/flash/.test(id) ? 4 : 0) : (/pro/.test(id) ? 5 : /flash/.test(id) ? 2 : 0)) -
    (/lite/.test(id) ? 3 : 0) - (/preview|exp/.test(id) ? 0.5 : 0);
  ms.sort((a, b) => score(b.id) - score(a.id));
  if (!ms.length) throw new Error("No Gemini text model available to this key");
  return ms[0].id;
}

async function ttsModels() {
  if (process.env.GEMINI_TTS_MODEL) return [process.env.GEMINI_TTS_MODEL];
  const ms = (await models()).filter((m) => /tts/.test(m.id)).map((m) => m.id);
  const score = (id) => version(id) * 10 + (/pro/.test(id) ? 3 : /flash/.test(id) && !/lite/.test(id) ? 2 : 0) - (/lite/.test(id) ? 1 : 0);
  ms.sort((a, b) => score(b) - score(a));
  if (!ms.length) throw new Error("No Gemini TTS model available to this key");
  return ms;
}

async function generate(model, parts, { json = null, temperature = 0.7 } = {}) {
  const body = { contents: [{ role: "user", parts }], generationConfig: { temperature } };
  if (json) { body.generationConfig.responseMimeType = "application/json"; body.generationConfig.responseSchema = json; }
  const r = await api("POST", `models/${model}:generateContent`, body);
  const text = (r.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  if (!text) throw new Error(`Empty response from ${model}: ${JSON.stringify(r).slice(0, 400)}`);
  return json ? JSON.parse(text) : text;
}

// ---------- script ----------
const schema = () => ({
  type: "OBJECT",
  properties: {
    lines: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" } }, required: ["id", "text"] } },
    labels: { type: "OBJECT", properties: Object.fromEntries(Object.keys(LABELS).map((k) => [k, { type: "STRING" }])), required: Object.keys(LABELS) },
  },
  required: ["lines", "labels"],
});

const STYLE_RULES = `
Language and style rules:
- Write everything in natural, modern, spoken Khmer (ភាសាខ្មែរ) for Cambodian business owners, managers and staff who are not technical.
- Simple words, short sentences, warm and confident. Not literary, not a word-for-word translation of English.
- Keep these technical terms in English, written in Latin letters exactly like this: ${ENGLISH_TERMS.join(", ")}. Never transliterate them into Khmer script.
- Narration lines are read aloud by a text-to-speech voice: write numbers in narration as Khmer words (for example ម្ភៃបួន, not ២៤), use the Khmer full stop ។ at sentence ends, and use spaces only between phrases as normal Khmer writing does.
- On-screen labels must be very short and must fit their character limit. No full stop ។ at the end of a label (a final ? or ! is fine where natural).
- Do not mention any brand, company, person, or AI product name.
- Spell carefully: correct Khmer spelling and correct subscript (ជើង) forms matter.`;

function draftPrompt() {
  return `You are an expert Khmer scriptwriter for professional 60-second motion-graphics explainer videos.
Topic: "${TOPIC}"
The video is a premium animated explainer. Each narration line plays over its own animated scene, so every line must say exactly what its intent says, in that order, and fit its time budget. A Khmer TTS voice reads about 12 Khmer characters per second, so a line with a budget of N seconds should be at most about 12 x N characters.
${STYLE_RULES}

Narration lines (id | seconds | intent):
${LINES.map((l) => `${l.id} | ${l.sec}s (max ~${Math.round(l.sec * 12)} chars) | ${l.intent}`).join("\n")}

On-screen labels (key | English meaning | max characters | where it appears):
${Object.entries(LABELS).map(([k, [m, n, u]]) => `${k} | ${m} | ${n} | ${u}`).join("\n")}

Return JSON with "lines" (every id above, in order, with its Khmer "text") and "labels" (every key above).`;
}

function reviewPrompt(draft) {
  return `You are a senior Khmer editor and an AI expert. Review this Khmer narration and label set for a 60-second explainer video on "${TOPIC}".
Fix any spelling mistakes, unnatural phrasing, literal translation, wrong meaning, inconsistent terms between narration and labels, or lines that are too long for their time budget. Keep each line's intent and order. Keep the same JSON shape and every id and key.
${STYLE_RULES}

Time budgets (id | seconds | intent):
${LINES.map((l) => `${l.id} | ${l.sec}s (max ~${Math.round(l.sec * 12)} chars) | ${l.intent}`).join("\n")}

Label limits (key | meaning | max characters):
${Object.entries(LABELS).map(([k, [m, n]]) => `${k} | ${m} | ${n}`).join("\n")}

Draft JSON:
${JSON.stringify(draft, null, 1)}

Return the corrected JSON only.`;
}

function validate(s) {
  const problems = [];
  const ids = new Set(s.lines.map((l) => l.id));
  for (const l of LINES) if (!ids.has(l.id)) problems.push(`missing line ${l.id}`);
  for (const k of Object.keys(LABELS)) if (!s.labels[k]) problems.push(`missing label ${k}`);
  for (const [k, [, max]] of Object.entries(LABELS)) {
    const v = s.labels[k] || "";
    if ([...v].length > Math.ceil(max * 1.35)) problems.push(`label ${k} too long (${[...v].length}/${max}): ${v}`);
  }
  for (const l of s.lines) if (!/[ក-៿]/.test(l.text)) problems.push(`line ${l.id} has no Khmer text`);
  return problems;
}

async function stepScript() {
  const model = await textModel();
  log(`script model: ${model}`);
  let draft = await generate(model, [{ text: draftPrompt() }], { json: schema(), temperature: 0.8 });
  writeJson(join(OUT, "script-draft.json"), draft);
  let reviewed = await generate(model, [{ text: reviewPrompt(draft) }], { json: schema(), temperature: 0.3 });
  let problems = validate(reviewed);
  if (problems.length) {
    log(`fixing ${problems.length} issue(s): ${problems.join("; ")}`);
    reviewed = await generate(model, [{ text: `${reviewPrompt(reviewed)}\n\nThese problems must be fixed:\n- ${problems.join("\n- ")}` }], { json: schema(), temperature: 0.2 });
    problems = validate(reviewed);
  }
  if (problems.some((p) => p.startsWith("missing"))) throw new Error(`Script incomplete: ${problems.join("; ")}`);
  if (problems.length) log(`warnings: ${problems.join("; ")}`);
  const byId = Object.fromEntries(reviewed.lines.map((l) => [l.id, l.text.trim()]));
  const script = {
    source: `gemini:${model}`,
    voice: null,
    lines: LINES.map((l) => ({ id: l.id, scene: l.scene, text: byId[l.id] })),
    labels: Object.fromEntries(Object.keys(LABELS).map((k) => [k, reviewed.labels[k].trim().replace(/។$/, "")])),
  };
  writeJson(join(ROOT, "content/script.json"), script);
  log(`script written: ${script.lines.length} lines, ${Object.keys(script.labels).length} labels`);
  script.lines.forEach((l) => log(`  ${l.id}: ${l.text}`));
}

// ---------- voice ----------
const DIRECTION = "Read this in Khmer as a warm, confident, professional narrator for a premium business explainer video. Natural Cambodian pronunciation, clear articulation, friendly and engaging, a slightly brisk but relaxed pace. Say English terms such as AI Agent in natural English.";

function pcmToWav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF"); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

function toWav(data, mime = "") {
  const buf = Buffer.from(data, "base64");
  if (buf.toString("ascii", 0, 4) === "RIFF") return buf;
  const rate = Number((/rate=(\d+)/i.exec(mime) || [])[1] || 24000);
  return pcmToWav(buf, rate);
}

async function ttsGenerateContent(model, text) {
  const r = await api("POST", `models/${model}:generateContent`, {
    contents: [{ role: "user", parts: [{ text: `${DIRECTION}\n\n${text}` }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
  });
  const part = (r.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!part) throw new Error(`no audio in response: ${JSON.stringify(r).slice(0, 300)}`);
  return toWav(part.inlineData.data, part.inlineData.mimeType);
}

async function ttsInteractions(model, text) {
  const r = await api("POST", "interactions", {
    model,
    input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style: DIRECTION }] }] }],
    response_format: { type: "audio", mime_type: "audio/wav" },
    generation_config: { speech_config: [{ voice: VOICE }] },
    store: false,
  });
  const audio = (r.steps || []).filter((s) => s.type === "model_output").flatMap((s) => s.content || []).find((p) => p.type === "audio");
  if (!audio?.data) throw new Error(`no audio in interaction: ${JSON.stringify(r).slice(0, 300)}`);
  return toWav(audio.data, audio.mime_type);
}

async function tts(model, text) {
  const order = /^gemini-3\.8/.test(model) ? [ttsInteractions, ttsGenerateContent] : [ttsGenerateContent, ttsInteractions];
  let err;
  for (const fn of order) {
    try { return await fn(model, text); } catch (e) { err = e; }
  }
  throw err;
}

const normKm = (s) => s.toLowerCase().replace(/[\s​‌‍។៖?!,.\-'"“”()]/g, "");
function similarity(a, b) {
  a = [...normKm(a)]; b = [...normKm(b)];
  if (!a.length || !b.length) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

async function transcribe(wavPath) {
  const model = await textModel({ fast: true });
  const data = readFileSync(wavPath).toString("base64");
  const text = await generate(model, [
    { inlineData: { mimeType: "audio/wav", data } },
    { text: "Transcribe this Khmer speech exactly as it is spoken, in Khmer script. Write English words in Latin letters. Output only the transcript, nothing else." },
  ], { temperature: 0 });
  return text.trim();
}

const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

async function voiceLine(line, models, attempts = 3) {
  let best = null;
  for (let a = 0; a < attempts; a++) {
    const model = models[Math.min(a, models.length - 1)];
    const rawPath = join(RAW, `${line.id}-${a}.wav`);
    const prepPath = join(RAW, `${line.id}-${a}-prep.wav`);
    try {
      writeFileSync(rawPath, await tts(model, line.text));
      const r = spawnSync("python3", [join(ROOT, "tools/voice_prep.py"), rawPath, prepPath], { encoding: "utf8" });
      if (r.status !== 0) throw new Error(`voice_prep failed: ${r.stderr}`);
      let heard = "", sim = 0.5; // unverified if the transcription check itself is blocked
      try { heard = await transcribe(prepPath); sim = similarity(line.text, heard); }
      catch (e) { log(`  ${line.id} transcription check unavailable: ${redact(e.message).slice(0, 120)}`); }
      const dur = probe(prepPath);
      log(`  ${line.id} try ${a + 1} (${model}): ${dur.toFixed(2)}s, match ${(sim * 100).toFixed(0)}%`);
      const cand = { model, prepPath, sim, dur, heard };
      if (!best || sim > best.sim) best = cand;
      if (sim >= 0.88) break;
    } catch (e) {
      log(`  ${line.id} try ${a + 1} (${model}) failed: ${redact(e.message).slice(0, 300)}`);
    }
  }
  if (!best) throw new Error(`TTS failed for ${line.id}`);
  writeFileSync(join(VOICE_DIR, `${line.id}.wav`), readFileSync(best.prepPath));
  return best;
}

async function stepVoice(only = null) {
  const script = readJson(join(ROOT, "content/script.json"));
  if (!script.source.startsWith("gemini")) throw new Error("content/script.json is not a Gemini script yet; run the script step first");
  const models = await ttsModels();
  log(`tts models: ${models.join(", ")}; voice ${VOICE}`);
  const reportPath = join(OUT, "voice-report.json");
  const report = existsSync(reportPath) ? readJson(reportPath) : {};
  for (const line of script.lines) {
    if (only && !only.includes(line.id)) continue;
    const r = await voiceLine(line, models);
    report[line.id] = { model: r.model, seconds: +r.dur.toFixed(2), match: +r.sim.toFixed(3), heard: r.heard, text: line.text };
    writeJson(reportPath, report);
  }
  script.voice = { name: VOICE, models: [...new Set(Object.values(report).map((r) => r.model))] };
  writeJson(join(ROOT, "content/script.json"), script);
  const total = Object.values(report).reduce((s, r) => s + r.seconds, 0);
  log(`voice total ${total.toFixed(1)}s`);
  return report;
}

// ---------- fit ----------
async function stepFit() {
  for (let round = 0; round < 2; round++) {
    const script = readJson(join(ROOT, "content/script.json"));
    const report = readJson(join(OUT, "voice-report.json"));
    const total = Object.values(report).reduce((s, r) => s + r.seconds, 0);
    if (total <= MAX_VOICE) { log(`fit: voice ${total.toFixed(1)}s is within ${MAX_VOICE}s`); return; }
    const over = LINES.map((l) => ({ ...l, dur: report[l.id].seconds, text: script.lines.find((x) => x.id === l.id).text }))
      .filter((l) => l.dur > l.sec * 1.12).sort((a, b) => b.dur / b.sec - a.dur / a.sec).slice(0, 6);
    if (!over.length) { log(`fit: voice ${total.toFixed(1)}s, no single line is clearly long; keeping it`); return; }
    log(`fit round ${round + 1}: voice ${total.toFixed(1)}s > ${MAX_VOICE}s, tightening ${over.map((l) => l.id).join(", ")}`);
    const model = await textModel();
    const res = await generate(model, [{ text: `Shorten these Khmer narration lines so each one can be read in its target time. Keep the meaning, the order of ideas and the English terms. Natural spoken Khmer.
${STYLE_RULES}

${over.map((l) => `${l.id} | now ${l.dur.toFixed(1)}s, target ${l.sec}s | intent: ${l.intent}\ncurrent: ${l.text}`).join("\n\n")}

Return JSON {"lines":[{"id","text"}]} with only these ids.` }], {
      json: { type: "OBJECT", properties: { lines: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" } }, required: ["id", "text"] } } }, required: ["lines"] },
      temperature: 0.4,
    });
    for (const l of res.lines) {
      const target = script.lines.find((x) => x.id === l.id);
      if (target && /[ក-៿]/.test(l.text)) target.text = l.text.trim();
    }
    writeJson(join(ROOT, "content/script.json"), script);
    await stepVoice(res.lines.map((l) => l.id));
  }
}

// ---------- music ----------
function stepMusic() {
  execFileSync("node", [join(ROOT, "tools/timing.mjs")], { stdio: "inherit" });
  const { total } = readJson(join(ROOT, "content/timing.json"));
  const check = spawnSync("python3", ["-c", "import google.genai"], { encoding: "utf8" });
  if (check.status !== 0) execFileSync("python3", ["-m", "pip", "install", "-q", "google-genai"], { stdio: "inherit" });
  const r = spawnSync("python3", [join(ROOT, "tools/lyria.py"), "--output", join(ROOT, "assets/audio/music_lyria.wav"), "--duration", String(Math.ceil(total + 4))], { stdio: "inherit" });
  if (r.status !== 0) log("Lyria music failed; the mixer will use the built-in score instead.");
}

const step = process.argv[2] || "all";
try {
  if (step === "script" || step === "all") await stepScript();
  if (step === "voice" || step === "all") await stepVoice(process.argv.slice(3).length ? process.argv.slice(3) : null);
  if (step === "fit" || step === "all") await stepFit();
  if (step === "music" || step === "all") stepMusic();
  if (step === "models") { const m = await models(); console.log(m.map((x) => x.id).join("\n")); }
  log("done");
} catch (e) {
  console.error("[gemini] failed:", redact(e.stack || e.message));
  process.exit(1);
}
