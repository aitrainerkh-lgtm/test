// Scene plan: order, target durations, narration segment roles and pauses.
// Shared by the script generator, the narrator and the composition builder.

export const TOTAL_TARGET_S = 120;
export const LEAD_IN_S = 0.5; // visuals enter before the voice starts
export const GAP_S = 0.3; // pause between narration segments
export const TAIL_S = 0.5; // hold after the last segment of a scene
export const CLOSING_TAIL_S = 2.0; // end card holds silently

export const SCENES = [
  { id: 'hook', target: 8, roles: ['question', 'problem'] },
  { id: 'problem', target: 12, roles: ['busy', 'rule', 'approx'] },
  { id: 'ex1', target: 19, roles: ['situation', 'measure', 'action', 'benefit'] },
  { id: 'ex2', target: 19, roles: ['situation', 'measure', 'action', 'benefit'] },
  { id: 'ex3', target: 19, roles: ['situation', 'measure', 'action', 'benefit'] },
  { id: 'ex4', target: 19, roles: ['situation', 'measure', 'action', 'benefit'] },
  { id: 'summary', target: 14, roles: ['tasks', 'customers', 'repetitive', 'workspace'] },
  { id: 'closing', target: 10, roles: ['cta', 'brand'] },
];

// Share of a scene's speaking time per role (defaults to an even split).
const ROLE_WEIGHT = { situation: 0.26, measure: 0.3, action: 0.24, benefit: 0.2, cta: 0.7, brand: 0.3 };

export const tailFor = (scene) => (scene.id === 'closing' ? CLOSING_TAIL_S : TAIL_S);

export function speechBudget(scene) {
  return scene.target - LEAD_IN_S - tailFor(scene) - GAP_S * (scene.roles.length - 1);
}

export function roleSeconds(scene) {
  const weights = scene.roles.map((r) => ROLE_WEIGHT[r] ?? 1 / scene.roles.length);
  const sum = weights.reduce((a, b) => a + b, 0);
  const budget = speechBudget(scene);
  return Object.fromEntries(scene.roles.map((r, i) => [r, (budget * weights[i]) / sum]));
}

// Spoken length measure for Khmer: characters, not words. Spaces and zero-width
// characters are not counted.
export function khmerLength(text) {
  return [...text.replace(/[\s​‌‍]/g, '')].length;
}
