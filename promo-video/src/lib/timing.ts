import { config } from '../config';
import assets from '../generated/assets.json';
import { FPS } from './anim';

export const SCENE_KEYS = ['hook', 'title', 'useAi', 'stock', 'billing', 'leave', 'agent', 'moreTools', 'offer', 'close'] as const;
export type SceneKey = (typeof SCENE_KEYS)[number];

export type Window = { from: number; to: number }; // frames

const f = (s: number) => Math.round(s * FPS);

const voSegments: Array<[number, number]> | null =
  (config.voiceover.segments as Array<[number, number]> | null) ??
  (assets.voiceover.segments as Array<[number, number]> | null);
const hasVo = assets.files.voiceover;

const build = (): { scenes: Window[]; captions: Window[]; total: number } => {
  const n = SCENE_KEYS.length;

  // 1) Voiceover with known line timings: scenes follow the voice.
  if (hasVo && voSegments && voSegments.length === n) {
    const lead = 0.25; // the picture changes slightly before the voice
    const starts = voSegments.map(([s], i) => (i === 0 ? 0 : Math.max(voSegments[i - 1][1], s - lead)));
    const end = voSegments[n - 1][1] + config.timing.endHoldSeconds;
    const scenes = starts.map((s, i) => ({ from: f(s), to: f(i < n - 1 ? starts[i + 1] : end) }));
    const captions = voSegments.map(([s, e]) => ({ from: f(s), to: f(e) }));
    return { scenes, captions, total: f(end) };
  }

  // 2) Default timings (stretched evenly if a voiceover is longer than 40s).
  const base = config.timing.sceneSeconds;
  const baseTotal = base.reduce((a, b) => a + b, 0);
  const voTotal = hasVo && assets.voiceover.duration ? assets.voiceover.duration + config.timing.endHoldSeconds : 0;
  const scale = voTotal > baseTotal ? voTotal / baseTotal : 1;
  let t = 0;
  const scenes: Window[] = [];
  const captions: Window[] = [];
  base.forEach((d) => {
    const from = t;
    t += d * scale;
    scenes.push({ from: f(from), to: f(t) });
    captions.push({ from: f(from + 0.15), to: f(t - 0.25) });
  });
  return { scenes, captions, total: f(t) };
};

export const TIMING = build();
export const sceneWindow = (k: SceneKey) => TIMING.scenes[SCENE_KEYS.indexOf(k)];
