import React, { useMemo } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { config } from '../config';
import { clamp } from '../lib/anim';
import { splitWords, Word } from '../lib/text';
import { TIMING } from '../lib/timing';
import { C, FONT } from '../theme';

type TimedWord = Word & { from: number; to: number };
type Line = { from: number; to: number; pages: TimedWord[][] };

const buildLines = (): Line[] =>
  config.voiceover.lines.map((text, i) => {
    const win = TIMING.captions[i] ?? { from: 0, to: 0 };
    const ws = splitWords(text);
    const totalW = ws.reduce((a, w) => a + w.weight, 0);
    let t = win.from;
    const timed: TimedWord[] = ws.map((w) => {
      const d = ((win.to - win.from) * w.weight) / totalW;
      const tw = { ...w, from: t, to: t + d };
      t += d;
      return tw;
    });
    const pages: TimedWord[][] = [[]];
    let len = 0;
    for (const w of timed) {
      const l = w.text.length + w.space.length;
      if (len + l > config.captions.maxCharsPerPage && pages[pages.length - 1].length) {
        pages.push([]);
        len = 0;
      }
      pages[pages.length - 1].push(w);
      len += l;
    }
    return { from: win.from, to: win.to, pages };
  });

export const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = useMemo(buildLines, []);
  if (!config.captions.show) return null;

  // Keep a line on screen from its start until the next line starts.
  const idx = lines.findIndex((l, i) => frame >= l.from - 6 && frame < (lines[i + 1]?.from ?? Infinity) - 6);
  if (idx < 0) return null;
  const line = lines[idx];
  if (!line) return null;
  const nextFrom = lines[idx + 1]?.from ?? Infinity;
  const fadeIn = interpolate(frame, [line.from - 6, line.from + 6], [0, 1], clamp);
  const fadeOut = interpolate(frame, [Math.min(line.to + 30, nextFrom - 10), Math.min(line.to + 40, nextFrom - 4)], [1, 0], clamp);
  const lastFrame = frame >= TIMING.total - 1;
  const opacity = lastFrame ? fadeIn : Math.min(fadeIn, idx === lines.length - 1 ? 1 : fadeOut);

  let pageIdx = line.pages.findIndex((p) => frame < p[p.length - 1].to);
  if (pageIdx === -1) pageIdx = line.pages.length - 1;
  const page = line.pages[pageIdx];
  const pageStart = page[0].from;
  const pageIn = pageIdx === 0 ? 1 : interpolate(frame, [pageStart - 4, pageStart + 6], [0, 1], clamp);

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 1420,
        minHeight: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 28,
          boxShadow: '0 14px 36px rgba(20,36,107,0.10)',
          padding: '26px 40px 30px',
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.75,
          maxWidth: 960,
          opacity: pageIn,
          transform: `translateY(${(1 - pageIn) * 14}px)`,
        }}
      >
        {page.map((w, i) => {
          const active = frame >= w.from && frame < w.to;
          const past = frame >= w.to;
          const bar = interpolate(frame, [w.from, w.from + 8], [0, 1], clamp);
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: active || past ? C.navy : C.greyLight,
                  zIndex: 0,
                }}
              >
                {w.text}
                {active ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 6,
                      height: 9,
                      borderRadius: 6,
                      background: C.lime,
                      transform: `scaleX(${bar})`,
                      transformOrigin: 'left',
                    }}
                  />
                ) : null}
              </span>
              {w.space ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
