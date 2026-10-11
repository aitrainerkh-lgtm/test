// Step 1: measure the Kore voice's Khmer speaking rate, then ask Gemini for the script.
// Output: script/calibration.json, script/script.json
import fs from 'node:fs';
import { client, p, readJson, resolveTextModel, resolveTtsModel, withRetry, writeJson } from './lib.mjs';
import { SCENES, khmerLength, roleSeconds } from './plan.mjs';
import { SCRIPT_SCHEMA, validateScript } from './schema.mjs';
import { synthesize } from './tts.mjs';

const ai = client();
const textModel = await resolveTextModel(ai);
const ttsModel = await resolveTtsModel(ai);
console.log(`Script model: ${textModel}\nVoice model: ${ttsModel} (voice ${process.env.GEMINI_VOICE || 'Kore'})`);

async function ask(contents, json) {
  const res = await withRetry('script', () =>
    ai.models.generateContent({
      model: textModel,
      contents,
      config: json ? { responseMimeType: 'application/json', responseJsonSchema: SCRIPT_SCHEMA, temperature: 0.7 } : { temperature: 0.7 },
    }),
  );
  return res.text;
}

// 1. Calibration: the real speaking rate of this voice in Khmer.
const calFile = p('script', 'calibration.json');
let cal = fs.existsSync(calFile) ? readJson(calFile) : null;
if (!cal || cal.ttsModel !== ttsModel) {
  const sample = (await ask([{ role: 'user', parts: [{ text:
    'Write about 6 short sentences of natural spoken Khmer, as a friendly manager explaining to staff how to plan the working day. ' +
    'Use simple words, no numbers, no emoji, no English. Return only the Khmer text.' }] }], false)).trim();
  const takes = [];
  for (const sentence of sample.split(/(?<=[។?!])\s*/).filter((x) => x.trim())) {
    const { duration } = await synthesize(ai, ttsModel, sentence);
    takes.push({ sentence, chars: khmerLength(sentence), duration });
  }
  const chars = takes.reduce((a, t) => a + t.chars, 0);
  const secs = takes.reduce((a, t) => a + t.duration, 0);
  cal = { ttsModel, charsPerSecond: +(chars / secs).toFixed(2), takes };
  writeJson(calFile, cal);
}
console.log(`Measured speaking rate: ${cal.charsPerSecond} Khmer characters per second`);

// 2. Script, with per-segment character budgets from the measured rate.
const rows = SCENES.map((s) => {
  const secs = roleSeconds(s);
  const parts = s.roles.map((r) => `${r} ≈ ${Math.round(secs[r] * cal.charsPerSecond)} chars (${secs[r].toFixed(1)} s)`);
  return `- ${s.id} (${s.target} s): ${parts.join('; ')}`;
}).join('\n');
const prompt = fs.readFileSync(p('gemini', 'script-prompt.md'), 'utf8')
  .replace('{{CHARS_PER_SECOND}}', String(cal.charsPerSecond))
  .replace('{{BUDGET_TABLE}}', rows);

const contents = [{ role: 'user', parts: [{ text: prompt }] }];
let script;
for (let attempt = 1; attempt <= 4; attempt++) {
  const text = await ask(contents, true);
  script = JSON.parse(text);
  const { errors, warnings } = validateScript(script);
  warnings.forEach((w) => console.warn(`warning: ${w}`));
  if (!errors.length) break;
  console.warn(`Attempt ${attempt}: ${errors.length} problem(s)\n  ` + errors.join('\n  '));
  if (attempt === 4) {
    writeJson(p('script', 'script.rejected.json'), script);
    console.error('The script still fails the checks. See script/script.rejected.json.');
    process.exit(4);
  }
  contents.push({ role: 'model', parts: [{ text }] }, { role: 'user', parts: [{ text:
    'Fix these problems and return the full corrected JSON. Keep everything else the same.\n- ' + errors.join('\n- ') }] });
}

script.meta = { language: 'km', textModel, ttsModel, voice: process.env.GEMINI_VOICE || 'Kore', charsPerSecond: cal.charsPerSecond };
writeJson(p('script', 'script.json'), script);
console.log('Wrote script/script.json');
