// JSON schema for the Gemini script, plus the checks the script must pass.
import { SCENES, khmerLength } from './plan.mjs';
import { asciiDigits } from './lib.mjs';

const str = { type: 'string' };
const strList = (min, max) => ({ type: 'array', items: str, minItems: min, maxItems: max });
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties) });
const narration = (roles) => obj(Object.fromEntries(roles.map((r) => [r, str])));
const item = obj({ label: str, value: { type: 'integer' } });
const shareChart = obj({ metric: str, items: { type: 'array', items: item, minItems: 5, maxItems: 8 }, highlight_count: { type: 'integer' } });
const exampleScreen = obj({ title: str, business: str, situation: str, measure: str, action: str, benefit: str });
const roles = Object.fromEntries(SCENES.map((s) => [s.id, s.roles]));

export const SCRIPT_SCHEMA = obj({
  title: str,
  illustrative_label: str,
  ui: obj({ situation: str, measure: str, action: str, benefit: str, example: str }),
  hook: obj({ narration: narration(roles.hook), screen: obj({ question: str, busy_items: strList(4, 5) }) }),
  problem: obj({
    narration: narration(roles.problem),
    screen: obj({ busy_label: str, progress_label: str, rule_title: str, few_label: str, most_label: str, approx_note: str }),
  }),
  ex1: obj({ narration: narration(roles.ex1), screen: exampleScreen, chart: shareChart }),
  ex2: obj({ narration: narration(roles.ex2), screen: exampleScreen, chart: shareChart }),
  ex3: obj({
    narration: narration(roles.ex3),
    screen: exampleScreen,
    chart: obj({ metric: str, items: { type: 'array', items: item, minItems: 5, maxItems: 7 }, highlight_count: { type: 'integer' } }),
  }),
  ex4: obj({
    narration: narration(roles.ex4),
    screen: exampleScreen,
    chart: obj({
      near_label: str,
      near_items: strList(3, 4),
      far_label: str,
      far_items: strList(2, 3),
      distraction_metric: str,
      distractions: { type: 'array', items: obj({ label: str, before: { type: 'integer' }, after: { type: 'integer' } }), minItems: 2, maxItems: 3 },
    }),
  }),
  summary: obj({ narration: narration(roles.summary), screen: obj({ title: str, actions: strList(4, 4) }) }),
  closing: obj({
    narration: narration(roles.closing),
    screen: obj({ cta_title: str, card_task: str, card_workspace: str, today_label: str, brand_tagline: str }),
  }),
});

// Limits for on-screen text, in Khmer characters (spaces not counted).
const LIMITS = { title: 30, label: 26, line: 48, chart: 22 };
const KHMER = /[ក-៿]/;
const EMOJI = /\p{Extended_Pictographic}/u;
const TOOL_NAMES = /\b(ChatGPT|Claude|Gemini|Copilot|Veo)\b/i;
const PROFIT = /ប្រាក់ចំណេញ|ចំណេញ/;

const numbersIn = (text) => (asciiDigits(text).match(/\d+(?:\.\d+)?/g) || []).map(Number);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// Highlighted items: the top N by value.
export function topItems(chart) {
  return [...chart.items].sort((a, b) => b.value - a.value).slice(0, chart.highlight_count);
}

export function validateScript(s) {
  const errors = [];
  const warn = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);

  // Every string: Khmer, no emoji, no AI tool names.
  const walk = (v, where) => {
    if (typeof v === 'string') {
      if (!v.trim()) err(where, 'empty text');
      if (EMOJI.test(v)) err(where, 'contains emoji');
      if (TOOL_NAMES.test(v)) err(where, `names an AI tool ("${v.match(TOOL_NAMES)[0]}"); the video must not advertise AI tools`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, where ? `${where}.${k}` : k);
  };
  const { meta, ...content } = s; // meta holds model names, not video text
  walk(content, '');

  for (const scene of SCENES) {
    for (const role of scene.roles) {
      const t = s[scene.id]?.narration?.[role] || '';
      if (!KHMER.test(t)) err(`${scene.id}.narration.${role}`, 'narration must be Khmer');
    }
  }

  const limit = (where, text, max) => {
    if (typeof text === 'string' && khmerLength(text) > max) err(where, `on-screen text too long (${khmerLength(text)} > ${max} characters): "${text}"`);
  };
  limit('title', s.title, LIMITS.title);
  limit('illustrative_label', s.illustrative_label, LIMITS.label);
  for (const k of Object.keys(s.ui)) limit(`ui.${k}`, s.ui[k], 16);
  limit('hook.screen.question', s.hook.screen.question, LIMITS.line);
  s.hook.screen.busy_items.forEach((t, i) => limit(`hook.screen.busy_items[${i}]`, t, LIMITS.chart));
  for (const k of Object.keys(s.problem.screen)) limit(`problem.screen.${k}`, s.problem.screen[k], k === 'approx_note' ? LIMITS.line : LIMITS.label);
  for (const ex of ['ex1', 'ex2', 'ex3', 'ex4']) {
    const sc = s[ex].screen;
    limit(`${ex}.screen.title`, sc.title, LIMITS.title);
    limit(`${ex}.screen.business`, sc.business, LIMITS.label);
    for (const k of ['situation', 'measure', 'action', 'benefit']) limit(`${ex}.screen.${k}`, sc[k], LIMITS.line);
  }
  s.summary.screen.actions.forEach((t, i) => limit(`summary.screen.actions[${i}]`, t, LIMITS.line));
  for (const k of Object.keys(s.closing.screen)) limit(`closing.screen.${k}`, s.closing.screen[k], LIMITS.line);

  // Charts: integers, sums, highlight counts.
  const allowed = {};
  let exactEightyTwenty = 0;
  for (const ex of ['ex1', 'ex2', 'ex3']) {
    const c = s[ex].chart;
    c.items.forEach((it, i) => {
      limit(`${ex}.chart.items[${i}].label`, it.label, LIMITS.chart);
      if (!Number.isInteger(it.value) || it.value <= 0) err(`${ex}.chart.items[${i}]`, 'value must be a positive integer');
    });
    if (!(c.highlight_count >= 1 && c.highlight_count < c.items.length / 2 + 1)) err(`${ex}.chart.highlight_count`, 'must be at least 1 and a minority of the items');
    const total = sum(c.items.map((i) => i.value));
    if (ex !== 'ex3' && total !== 100) err(`${ex}.chart`, `shares must add up to exactly 100 (they add up to ${total})`);
    const top = sum(topItems(c).map((i) => i.value));
    const topShare = Math.round((top / total) * 100);
    const itemShare = Math.round((c.highlight_count / c.items.length) * 100);
    if (topShare === 80 && itemShare === 20) exactEightyTwenty++;
    allowed[ex] = new Set([...c.items.map((i) => i.value), top, topShare, total, total - top, 100 - topShare, c.items.length, c.highlight_count, itemShare, 100 - itemShare]);
  }
  const d = s.ex4.chart;
  d.distractions.forEach((x, i) => {
    if (!(Number.isInteger(x.before) && Number.isInteger(x.after) && x.before > x.after && x.after >= 0)) err(`ex4.chart.distractions[${i}]`, '"after" must be a smaller non-negative integer than "before"');
    limit(`ex4.chart.distractions[${i}].label`, x.label, LIMITS.chart);
  });
  [...d.near_items, ...d.far_items].forEach((t, i) => limit(`ex4.chart items[${i}]`, t, LIMITS.chart));
  limit('ex4.chart.near_label', d.near_label, LIMITS.chart);
  limit('ex4.chart.far_label', d.far_label, LIMITS.chart);
  limit('ex4.chart.distraction_metric', d.distraction_metric, LIMITS.line);
  for (const ex of ['ex1', 'ex2', 'ex3']) limit(`${ex}.chart.metric`, s[ex].chart.metric, LIMITS.line);
  allowed.ex4 = new Set(d.distractions.flatMap((x) => [x.before, x.after, x.before - x.after]));
  if (exactEightyTwenty > 1) err('charts', 'more than one example is exactly 80/20; vary the split, it is an approximate pattern');

  // Spoken numbers must come from the chart of the same example.
  const general = new Set([80, 20, 70, 30, 90, 10, 100, 1]);
  for (const scene of SCENES) {
    // Examples may also say "80/20" or "1" (as in "1 week").
    const ok = allowed[scene.id] ? new Set([...allowed[scene.id], 80, 20, 1]) : general;
    for (const role of scene.roles) {
      const text = s[scene.id].narration[role];
      for (const n of numbersIn(text)) {
        if (!ok.has(n)) {
          err(`${scene.id}.narration.${role}`, `the number ${n} is not in this example's chart data (or a sum of its highlighted items)`);
        }
      }
    }
    for (const n of numbersIn(Object.values(s[scene.id].screen || {}).flat().join(' '))) {
      if (!ok.has(n)) err(`${scene.id}.screen`, `the number ${n} is not in this example's chart data`);
    }
  }

  // Sales are not profit.
  for (const role of SCENES.find((x) => x.id === 'ex2').roles) {
    if (PROFIT.test(s.ex2.narration[role])) err(`ex2.narration.${role}`, 'refers to profit; this example is about sales');
  }
  if (PROFIT.test(JSON.stringify(s.ex2.screen) + JSON.stringify(s.ex2.chart))) err('ex2', 'screen or chart refers to profit; use sales');

  if (!/80\s*\/\s*20|80\/20/.test(asciiDigits(s.problem.narration.rule + s.problem.narration.approx))) warn.push('problem: narration does not say "80/20" explicitly');
  return { errors, warnings: warn };
}
