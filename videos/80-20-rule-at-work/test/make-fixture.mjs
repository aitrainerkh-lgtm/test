// Layout test only. Fills every text slot with filler Khmer words at (or near) its
// maximum allowed length, builds a timing file and silent audio, so the composition
// can be checked for overflow before the real Gemini script exists. Never shipped.
import fs from 'node:fs';
import { p, writeJson } from '../gemini/lib.mjs';
import { GAP_S, LEAD_IN_S, SCENES, khmerLength, roleSeconds, tailFor } from '../gemini/plan.mjs';
import { joinWav } from '../gemini/tts.mjs';

const WORDS = ['ការងារ', 'អតិថិជន', 'ផលិតផល', 'ការលក់', 'ពេលវេលា', 'សំខាន់', 'បុគ្គលិក', 'ប្រចាំថ្ងៃ', 'លទ្ធផល', 'សកម្មភាព', 'ឯកសារ', 'Template', 'ហាង', 'ទូរស័ព្ទ'];
let w = 0;
const fill = (max) => {
  let out = '';
  while (true) {
    const next = (out ? out + ' ' : '') + WORDS[w++ % WORDS.length];
    if (khmerLength(next) > max) return out || WORDS[0];
    out = next;
  }
};
const CPS = 13;
const narr = (id) => Object.fromEntries(Object.entries(roleSeconds(SCENES.find((s) => s.id === id))).map(([r, sec]) => [r, fill(Math.round(sec * CPS)) + '។']));
const ex = (id) => ({ title: fill(30), business: fill(26), situation: fill(48), measure: fill(48), action: fill(48), benefit: fill(48) });
const items = (vals) => vals.map((value) => ({ label: fill(22), value }));

const script = {
  title: fill(30),
  illustrative_label: fill(26),
  ui: { situation: fill(16), measure: fill(16), action: fill(16), benefit: fill(16), example: fill(10) },
  hook: { narration: narr('hook'), screen: { question: fill(48), busy_items: [fill(22), fill(18), fill(22), fill(16), fill(20)] } },
  problem: { narration: narr('problem'), screen: { busy_label: fill(26), progress_label: fill(26), rule_title: fill(26), few_label: fill(26), most_label: fill(26), approx_note: fill(48) } },
  ex1: { narration: narr('ex1'), screen: ex('ex1'), chart: { metric: fill(30), items: items([34, 22, 14, 10, 8, 7, 5]), highlight_count: 2 } },
  ex2: { narration: narr('ex2'), screen: ex('ex2'), chart: { metric: fill(30), items: items([28, 21, 17, 11, 9, 6, 5, 3]), highlight_count: 3 } },
  ex3: { narration: narr('ex3'), screen: ex('ex3'), chart: { metric: fill(30), items: items([48, 36, 25, 9, 7, 5]), highlight_count: 3 } },
  ex4: {
    narration: narr('ex4'), screen: ex('ex4'),
    chart: { near_label: fill(20), near_items: [fill(14), fill(12), fill(16), fill(10)], far_label: fill(20), far_items: [fill(14), fill(12), fill(16)], distraction_metric: fill(40), distractions: [{ label: fill(18), before: 40, after: 12 }, { label: fill(18), before: 25, after: 8 }, { label: fill(18), before: 15, after: 5 }] },
  },
  summary: { narration: narr('summary'), screen: { title: fill(30), actions: [fill(48), fill(48), fill(48), fill(48)] } },
  closing: { narration: narr('closing'), screen: { cta_title: fill(48), card_task: fill(48), card_workspace: fill(48), today_label: fill(20), brand_tagline: fill(48) } },
};

const timing = { scenes: [] };
let t = 0;
for (const scene of SCENES) {
  const segments = [];
  let at = t + LEAD_IN_S;
  scene.roles.forEach((role, i) => {
    if (i) at += GAP_S;
    const d = khmerLength(script[scene.id].narration[role]) / CPS;
    segments.push({ role, text: script[scene.id].narration[role], start: +at.toFixed(3), end: +(at + d).toFixed(3) });
    at += d;
  });
  const duration = Math.max(scene.target, at - t + tailFor(scene));
  timing.scenes.push({ id: scene.id, start: +t.toFixed(3), duration: +duration.toFixed(3), target: scene.target, segments });
  t += duration;
}
timing.total = +t.toFixed(3);
fs.mkdirSync(p('test', 'fixture'), { recursive: true });
writeJson(p('test', 'fixture', 'script.json'), script);
writeJson(p('test', 'fixture', 'timing.json'), timing);
joinWav([{ silence: timing.total }], p('test', 'fixture', 'silence.wav'));
console.log(`Fixture: ${timing.total.toFixed(1)} s`);
