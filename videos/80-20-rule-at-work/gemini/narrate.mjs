// Step 2: Kore narration for every segment, measured. Scenes that miss their target
// duration are rewritten by Gemini to fit, using the measured speaking rate, then re-voiced.
// Output: assets/narration.wav, script/timing.json, SCRIPT.md (script.json is updated in place).
import fs from 'node:fs';
import { client, p, readJson, resolveTtsModel, withRetry, writeJson } from './lib.mjs';
import { GAP_S, LEAD_IN_S, SCENES, TOTAL_TARGET_S, khmerLength, speechBudget, tailFor } from './plan.mjs';
import { validateScript } from './schema.mjs';
import { TEMPO, joinWav, synthesizeScene } from './tts.mjs';

const ROUNDS = Number(process.env.FIT_ROUNDS || 2);
const ai = client();
const script = readJson(p('script', 'script.json'));
const ttsModel = process.env.GEMINI_TTS_MODEL || script.meta?.ttsModel || (await resolveTtsModel(ai));
script.meta = { ...script.meta, ttsModel };
const textModel = script.meta?.textModel || process.env.GEMINI_TEXT_MODEL;

const tolerance = (scene) => Math.max(0.5, scene.target * 0.05);

async function voiceScene(scene) {
  const texts = scene.roles.map((role) => script[scene.id].narration[role]);
  const clips = await synthesizeScene(ai, ttsModel, texts);
  const takes = scene.roles.map((role, i) => ({ role, text: texts[i], ...clips[i] }));
  const speech = takes.reduce((a, t) => a + t.duration, 0);
  const natural = LEAD_IN_S + speech + GAP_S * (takes.length - 1) + tailFor(scene);
  return { takes, speech, natural };
}

async function refit(scene, voiced) {
  const factor = speechBudget(scene) / voiced.speech;
  const lines = voiced.takes.map((t) =>
    `- ${t.role}: now ${t.duration.toFixed(1)} s, ${khmerLength(t.text)} chars -> aim for about ${Math.round(khmerLength(t.text) * factor)} chars\n  current text: ${t.text}`);
  const ask = [
    `This is the "${scene.id}" scene of the Khmer narration for a 120-second explainer about the 80/20 rule at work.`,
    `When voiced, the scene runs ${voiced.natural.toFixed(1)} s but must run ${scene.target} s. ${factor < 1 ? 'Shorten' : 'Lengthen'} each segment to the character count shown.`,
    'Keep the same meaning, the same numbers, the same business situation and the same simple spoken Khmer. Keep English terms that are already in English.',
    'Every number must stay exactly as it is. Do not add new numbers. No emoji. Return only JSON with the same keys.',
    '', ...lines,
    '', 'On-screen text for this scene, which the narration must still match:', JSON.stringify(script[scene.id].screen),
  ].join('\n');
  const schema = { type: 'object', properties: Object.fromEntries(scene.roles.map((r) => [r, { type: 'string' }])), required: scene.roles };
  const res = await withRetry(`refit ${scene.id}`, () => ai.models.generateContent({
    model: textModel, contents: [{ role: 'user', parts: [{ text: ask }] }],
    config: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.4 },
  }));
  const next = JSON.parse(res.text);
  const before = script[scene.id].narration;
  script[scene.id].narration = next;
  const { errors } = validateScript(script);
  if (errors.length) {
    console.warn(`  rewrite of ${scene.id} rejected: ${errors.join('; ')}`);
    script[scene.id].narration = before;
    return false;
  }
  return true;
}

let voiced = {};
for (let round = 0; round <= ROUNDS; round++) {
  for (const scene of SCENES) voiced[scene.id] = await voiceScene(scene);
  const off = SCENES.filter((s) => Math.abs(voiced[s.id].natural - s.target) > tolerance(s));
  const total = SCENES.reduce((a, s) => a + Math.max(s.target, voiced[s.id].natural), 0);
  console.log(`Round ${round}: ` + SCENES.map((s) => `${s.id} ${voiced[s.id].natural.toFixed(1)}/${s.target}`).join(', ') + ` | total ${total.toFixed(1)} s`);
  if (!off.length || round === ROUNDS) break;
  if (!textModel) { console.warn('No script model recorded; skipping rewrites.'); break; }
  for (const scene of off) await refit(scene, voiced[scene.id]);
}

// A segment far slower than the measured rate may mean the voice read the style note aloud.
const cps = script.meta?.charsPerSecond && script.meta.charsPerSecond * TEMPO;
if (cps) for (const scene of SCENES) for (const t of voiced[scene.id].takes) {
  if (t.duration > 1.6 * (khmerLength(t.text) / cps) + 0.5) console.warn(`CHECK AUDIO: ${scene.id}.${t.role} is ${t.duration.toFixed(1)} s, much longer than expected. Listen to ${t.file}.`);
}

// Timeline: a scene lasts its target, or longer if its narration needs it.
const timing = { totalTarget: TOTAL_TARGET_S, voice: script.meta?.voice || 'Kore', ttsModel, scenes: [] };
const parts = [];
let t = 0;
for (const scene of SCENES) {
  const v = voiced[scene.id];
  const duration = +Math.max(scene.target, v.natural).toFixed(3);
  const segments = [];
  let at = t + LEAD_IN_S;
  parts.push({ silence: LEAD_IN_S });
  v.takes.forEach((take, i) => {
    if (i) { parts.push({ silence: GAP_S }); at += GAP_S; }
    segments.push({ role: take.role, text: take.text, start: +at.toFixed(3), end: +(at + take.duration).toFixed(3) });
    parts.push({ file: take.file });
    at += take.duration;
  });
  parts.push({ silence: t + duration - at });
  timing.scenes.push({ id: scene.id, start: +t.toFixed(3), duration, target: scene.target, segments });
  t += duration;
}
timing.total = +t.toFixed(3);
fs.mkdirSync(p('assets'), { recursive: true });
joinWav(parts, p('assets', 'narration.wav'));
writeJson(p('script', 'timing.json'), timing);
writeJson(p('script', 'script.json'), script);

// Readable script with measured timecodes.
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const md = [`# ${script.title}`, '', `Language: Khmer (km). Voice: ${timing.voice} (${ttsModel}). Script: ${textModel}.`,
  `Measured length: ${timing.total.toFixed(1)} s (target ${TOTAL_TARGET_S} s).`, ''];
for (const s of timing.scenes) {
  md.push(`## ${s.id} — ${fmt(s.start)} to ${fmt(s.start + s.duration)} (${s.duration.toFixed(1)} s, target ${s.target} s)`, '');
  for (const seg of s.segments) md.push(`- **${seg.role}** (${fmt(seg.start)}–${fmt(seg.end)}): ${seg.text}`);
  md.push('');
}
fs.writeFileSync(p('SCRIPT.md'), md.join('\n'));
console.log(`Narration: ${timing.total.toFixed(1)} s. Wrote assets/narration.wav, script/timing.json, SCRIPT.md`);
