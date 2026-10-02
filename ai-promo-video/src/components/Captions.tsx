import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CaptionLine, config} from '../config';
import {C, FONT_KH_BODY, SHADOW} from '../theme';

type Word = {text: string; start: number; end: number; spaceAfter: boolean};

const graphemes = (s: string) => {
  const seg = new Intl.Segmenter('km', {granularity: 'grapheme'});
  return Array.from(seg.segment(s)).length;
};

const fillTokens = (s: string) =>
  s
    .replace(/\{price\}/g, `$${config.offer.price}`)
    .replace(/\{durationKh\}/g, config.offer.durationKh)
    .replace(/\{telegram\}/g, config.close.telegramHandle);

/** Splits a caption line into timed words. */
export const buildWords = (line: CaptionLine): Word[] => {
  const text = fillTokens(line.text);
  const raw: {text: string; spaceAfter: boolean}[] = [];
  for (const chunk of text.split(' ').filter(Boolean)) {
    const parts = chunk.split('|').filter(Boolean);
    parts.forEach((p, i) => raw.push({text: p, spaceAfter: i === parts.length - 1}));
  }
  const speakEnd = line.end - 0.15;
  if (line.wordStarts && line.wordStarts.length === raw.length) {
    return raw.map((w, i) => ({
      ...w,
      start: line.wordStarts![i],
      end: i + 1 < raw.length ? line.wordStarts![i + 1] : speakEnd,
    }));
  }
  const weights = raw.map((w) => graphemes(w.text) + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = line.start;
  return raw.map((w, i) => {
    const d = ((speakEnd - line.start) * weights[i]) / total;
    const word = {...w, start: t, end: t + d};
    t += d;
    return word;
  });
};

const CaptionCard: React.FC<{line: CaptionLine}> = ({line}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const words = useMemo(() => buildWords(line), [line]);

  // Fade fully inside [start, end] so back-to-back lines never overlap.
  const fade = 0.1;
  const opacity = interpolate(t, [line.start, line.start + fade, line.end - fade, line.end], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(t, [line.start, line.start + 0.2], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 1545,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          background: 'rgba(255,255,255,0.94)',
          borderRadius: 24,
          boxShadow: SHADOW,
          padding: '22px 38px 26px',
          textAlign: 'center',
          fontFamily: FONT_KH_BODY,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.75,
        }}
      >
        {words.map((w, i) => {
          const active = t >= w.start && t < w.end;
          const done = t >= w.end;
          const p = interpolate(t, [w.start, Math.min(w.end, w.start + 0.25)], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <React.Fragment key={i}>
              <span style={{position: 'relative', display: 'inline-block', color: active || done ? C.navy : C.upcoming}}>
                {w.text}
                {active ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 2,
                      height: 7,
                      borderRadius: 4,
                      background: C.lime,
                      transform: `scaleX(${p})`,
                      transformOrigin: 'left center',
                    }}
                  />
                ) : null}
              </span>
              {w.spaceAfter ? ' ' : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const Captions: React.FC = () => {
  if (!config.captions.enabled) return null;
  return (
    <>
      {config.captions.lines.map((line, i) => (
        <CaptionCard key={i} line={line} />
      ))}
    </>
  );
};
