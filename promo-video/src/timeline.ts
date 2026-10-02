import {config, SCENE_ORDER, SceneKey} from './config';
import assets from './generated/assets.json';
import voice from './generated/voice-timing.json';

export const FPS = config.timing.fps;
export const OVERLAP = Math.round(config.timing.transition * FPS);

export type Slot = {
  key: SceneKey;
  /** First frame of the scene. */
  from: number;
  /** Frames until the next scene starts. */
  duration: number;
  /** Voice line start / end, in frames (absolute). */
  voiceFrom: number;
  voiceTo: number;
};

type Seg = {key: string; start: number; end: number};

const synced = (): Seg[] | null => {
  const segs = (voice as {segments?: Seg[]}).segments ?? [];
  if (!assets.voiceover || segs.length !== SCENE_ORDER.length) return null;
  return segs;
};

export const isVoiceSynced = () => synced() !== null;

const build = (): {slots: Slot[]; total: number} => {
  const segs = synced();
  const sec = (s: number) => Math.round(s * FPS);

  if (!segs) {
    let t = 0;
    const slots = SCENE_ORDER.map((key) => {
      const d = config.timing.scenes[key];
      const slot: Slot = {
        key,
        from: sec(t),
        duration: sec(d),
        voiceFrom: sec(t + 0.2),
        voiceTo: sec(t + d - 0.25),
      };
      t += d;
      return slot;
    });
    return {slots, total: sec(t)};
  }

  // Scenes start a moment before their voice line begins.
  const lead = 0.2;
  const starts = segs.map((s, i) => (i === 0 ? 0 : Math.max(0, s.start - lead)));
  const voiceEnd = segs[segs.length - 1].end;
  const end = Math.max(voiceEnd + config.timing.endTail, assets.voiceoverDuration ?? 0);
  const slots = SCENE_ORDER.map((key, i) => {
    const from = sec(starts[i]);
    const to = sec(i + 1 < starts.length ? starts[i + 1] : end);
    return {
      key,
      from,
      duration: to - from,
      voiceFrom: sec(segs[i].start),
      voiceTo: sec(segs[i].end),
    };
  });
  return {slots, total: sec(end)};
};

export const TIMELINE = build();

export const slotOf = (key: SceneKey) => TIMELINE.slots.find((s) => s.key === key)!;
