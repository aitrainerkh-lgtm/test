import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {config, SceneKey} from '../config';
import {C, FONT_KH_BODY, RADIUS, SHADOW_CARD} from '../theme';
import {clusters, Token, tokenize} from '../khmer';
import {TIMELINE, Slot} from '../timeline';
import {clamp, prog} from '../anim';

const PAGE_BUDGET = 40;
const PHRASE_PAUSE = 0.7;

const unitWidth = (t: string) =>
  clusters(t).reduce((w, c) => w + (/[ក-៿]/.test(c) ? 1 : /\s/.test(c) ? 0.3 : 0.55), 0);

type Timed = Token & {start: number; end: number};

const buildLine = (key: SceneKey, slot: Slot) => {
  const tokens = tokenize(config.voiceover[key]);
  const total = tokens.reduce((a, t, i) => a + t.weight + (t.phraseEnd && i < tokens.length - 1 ? PHRASE_PAUSE : 0), 0);
  const span = slot.voiceTo - slot.voiceFrom;
  let acc = 0;
  const timed: Timed[] = tokens.map((t, i) => {
    const start = slot.voiceFrom + (acc / total) * span;
    acc += t.weight;
    const end = slot.voiceFrom + (acc / total) * span;
    if (t.phraseEnd && i < tokens.length - 1) acc += PHRASE_PAUSE;
    return {...t, start, end};
  });

  // Group words into caption pages (about two lines each), breaking at phrases.
  const pages: number[][] = [];
  let page: number[] = [];
  let width = 0;
  let phrase: number[] = [];
  let phraseW = 0;
  const flushPhrase = () => {
    if (!phrase.length) return;
    if (width + phraseW > PAGE_BUDGET && page.length) {
      pages.push(page);
      page = [];
      width = 0;
    }
    page.push(...phrase);
    width += phraseW + 0.3;
    phrase = [];
    phraseW = 0;
  };
  timed.forEach((t, i) => {
    const w = unitWidth(t.text);
    if (phraseW + w > PAGE_BUDGET && phrase.length) flushPhrase();
    phrase.push(i);
    phraseW += w;
    if (t.phraseEnd) flushPhrase();
  });
  flushPhrase();
  if (page.length) pages.push(page);
  return {timed, pages};
};

export const Karaoke: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = useMemo(
    () => Object.fromEntries(TIMELINE.slots.map((s) => [s.key, buildLine(s.key, s)])),
    [],
  ) as Record<SceneKey, ReturnType<typeof buildLine>>;

  const slot =
    TIMELINE.slots.find((s) => frame >= s.from && frame < s.from + s.duration) ??
    TIMELINE.slots[TIMELINE.slots.length - 1];
  const {timed, pages} = lines[slot.key];

  let cur = -1;
  timed.forEach((t, i) => {
    if (frame >= t.start) cur = i;
  });
  const voiceDone = frame >= slot.voiceTo + 4;

  const pageIdx = Math.max(0, pages.findIndex((p) => p.includes(Math.max(cur, 0))));
  const pageTokens = pages[pageIdx];
  const pageStart = pageIdx === 0 ? slot.from : timed[pageTokens[0]].start;
  const slotEnd = slot.from + slot.duration;
  const textIn = interpolate(frame - pageStart, [0, 9], [0, 1], clamp);
  const textOut = interpolate(frame, [slotEnd - 9, slotEnd], [1, 0], clamp);
  const isLast = slot === TIMELINE.slots[TIMELINE.slots.length - 1];
  const textOpacity = textIn * (isLast ? 1 : textOut);
  const cardIn = prog(frame, 6, 18);

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        right: 48,
        top: 1540,
        height: 250,
        opacity: cardIn,
        transform: `translateY(${(1 - cardIn) * 40}px)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.94)',
          borderRadius: RADIUS,
          boxShadow: SHADOW_CARD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px 44px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'baseline',
            fontFamily: FONT_KH_BODY,
            fontSize: 48,
            lineHeight: 1.75,
            fontWeight: 400,
            opacity: textOpacity,
            transform: `translateY(${(1 - textIn) * 14}px)`,
          }}
        >
          {pageTokens.map((ti) => {
            const t = timed[ti];
            const isCur = ti === cur && !voiceDone;
            const past = ti < cur || (ti === cur && voiceDone);
            const bar = isCur ? prog(frame, t.start, Math.max(6, Math.min(14, t.end - t.start))) : 0;
            return (
              <span
                key={ti}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: isCur || past ? C.navy : C.lightGrey,
                  marginRight: t.phraseEnd ? '0.3em' : 0,
                  whiteSpace: 'pre',
                }}
              >
                {t.text}
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '0.12em',
                    height: 7,
                    width: `${bar * 100}%`,
                    background: C.lime,
                    borderRadius: 4,
                  }}
                />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
