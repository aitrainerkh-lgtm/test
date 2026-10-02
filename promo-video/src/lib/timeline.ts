import {config, VoiceTiming} from '../config';
import {clusters} from './text';

export const FPS = 60;
/** Cross-fade length between scenes, in frames. */
export const TRANSITION = 16;

export const sec = (s: number) => Math.round(s * FPS);

export type SceneKey = 'hook' | 'title' | 'useAI' | 'build' | 'moreTools' | 'offer' | 'close';
export const CARD_KEYS = ['stock', 'billing', 'leave', 'agent'] as const;
export type CardKey = (typeof CARD_KEYS)[number];

export type SceneSlot = {key: SceneKey; from: number; duration: number};

const S = config.scenes;

export const cardDurations = () => CARD_KEYS.map((k) => sec(S.build[k].durationSec));

export const getScenes = (): SceneSlot[] => {
  const durations: [SceneKey, number][] = [
    ['hook', sec(S.hook.durationSec)],
    ['title', sec(S.title.durationSec)],
    ['useAI', sec(S.useAI.durationSec)],
    ['build', cardDurations().reduce((a, b) => a + b, 0)],
    ['moreTools', sec(S.moreTools.durationSec)],
    ['offer', sec(S.offer.durationSec)],
    ['close', sec(S.close.durationSec)],
  ];
  let from = 0;
  return durations.map(([key, duration]) => {
    const slot = {key, from, duration};
    from += duration;
    return slot;
  });
};

export const totalFrames = () => getScenes().reduce((a, s) => a + s.duration, 0);

// ---------------- Karaoke captions ----------------

export type Token = {text: string; spaceBefore: boolean; start: number; end: number};
export type Page = {tokens: Token[]; start: number; end: number};

const tokenize = (voice: string) => {
  const out: {text: string; spaceBefore: boolean}[] = [];
  let spaceBefore = false;
  for (const part of voice.split(/( |\|)/)) {
    if (part === ' ') spaceBefore = true;
    else if (part === '|') spaceBefore = false;
    else if (part.length) {
      out.push({text: part, spaceBefore: out.length > 0 && spaceBefore});
      spaceBefore = false;
    }
  }
  return out;
};

const weight = (t: string) => clusters(t).length + 2 + (/[,។?!]$/.test(t) ? 5 : 0);

/** Max clusters per caption page (about two lines). */
const PAGE_BUDGET = 34;

const voiceUnits = (): {from: number; duration: number; v: VoiceTiming}[] => {
  const scenes = getScenes();
  const at = (k: SceneKey) => scenes.find((s) => s.key === k)!;
  const units: {from: number; duration: number; v: VoiceTiming}[] = [];
  const add = (from: number, duration: number, v: VoiceTiming) => units.push({from, duration, v});
  add(at('hook').from, at('hook').duration, S.hook);
  add(at('title').from, at('title').duration, S.title);
  add(at('useAI').from, at('useAI').duration, S.useAI);
  let f = at('build').from;
  CARD_KEYS.forEach((k, i) => {
    const d = cardDurations()[i];
    add(f, d, S.build[k]);
    f += d;
  });
  add(at('moreTools').from, at('moreTools').duration, S.moreTools);
  add(at('offer').from, at('offer').duration, S.offer);
  add(at('close').from, at('close').duration, S.close);
  return units;
};

export const getCaptionPages = (): Page[] => {
  const pages: Page[] = [];
  for (const {from, duration, v} of voiceUnits()) {
    const raw = tokenize(v.voice);
    const ws = from + sec(v.voiceStart ?? 0.2);
    const we = from + (v.voiceEnd !== undefined ? sec(v.voiceEnd) : duration - sec(0.25));
    const weights = raw.map((t) => weight(t.text));
    const total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    const starts = raw.map((_, i) => {
      if (v.wordTimes && v.wordTimes[i] !== undefined) return from + sec(v.wordTimes[i]);
      const s = ws + (acc / total) * (we - ws);
      acc += weights[i];
      return Math.round(s);
    });
    const tokens: Token[] = raw.map((t, i) => ({
      ...t,
      start: starts[i],
      end: i < raw.length - 1 ? starts[i + 1] : we,
    }));

    const totalSize = tokens.reduce((a, t) => a + clusters(t.text).length + (t.spaceBefore ? 1 : 0), 0);
    const nPages = Math.ceil(totalSize / PAGE_BUDGET);
    const budget = Math.min(PAGE_BUDGET, Math.ceil(totalSize / nPages) + 4);
    let cur: Token[] = [];
    let size = 0;
    const flush = () => {
      if (!cur.length) return;
      pages.push({tokens: cur, start: cur[0].start, end: cur[cur.length - 1].end});
      cur = [];
      size = 0;
    };
    for (const t of tokens) {
      const n = clusters(t.text).length + (t.spaceBefore ? 1 : 0);
      if (size + n > budget) flush();
      cur.push({...t, spaceBefore: cur.length ? t.spaceBefore : false});
      size += n;
    }
    flush();
  }
  // Each page stays visible until the next one starts (max 0.6 s hold).
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1]?.start ?? Infinity;
    pages[i].end = Math.min(next, pages[i].end + sec(0.6));
  }
  return pages;
};
