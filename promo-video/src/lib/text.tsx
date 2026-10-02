import React, { CSSProperties } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { clamp } from './anim';

/* ---------- Khmer-safe splitting ---------- */

const graphemes = new Intl.Segmenter('km', { granularity: 'grapheme' });
const words = new Intl.Segmenter('km', { granularity: 'word' });
const COENG = '្';

/** Typing units: grapheme clusters, kept together across a Khmer coeng (subscript) sign. */
export const clusters = (text: string): string[] => {
  const out: string[] = [];
  for (const { segment } of graphemes.segment(text)) {
    const prev = out[out.length - 1];
    if (prev && prev.endsWith(COENG)) out[out.length - 1] = prev + segment;
    else out.push(segment);
  }
  return out;
};

export type Word = { text: string; space: string; weight: number };

/** Splits a caption line into words (dictionary-based for Khmer, or on "|" when given). */
export const splitWords = (line: string): Word[] => {
  const raw: string[] = line.includes('|')
    ? line.split(/(\|| +)/).filter((s) => s !== '|' && s !== '')
    : [...words.segment(line)].map((s) => s.segment);
  const out: Word[] = [];
  for (const piece of raw) {
    if (/^\s+$/.test(piece)) {
      if (out.length) out[out.length - 1].space += ' ';
      continue;
    }
    const isPunct = /^[\p{P}។-៚]+$/u.test(piece);
    if (isPunct && out.length) {
      out[out.length - 1].text += piece;
      continue;
    }
    const latin = /^[\x00-\x7F]+$/.test(piece);
    const weight = latin ? Math.max(1.5, piece.length / 2.6) : Math.max(1, clusters(piece).length * 0.9);
    out.push({ text: piece, space: '', weight });
  }
  return out;
};

/* ---------- Inline icons (font-independent) ---------- */

export const CheckIcon: React.FC<{ size?: string | number; color?: string; stroke?: number }> = ({
  size = '0.9em',
  color = 'currentColor',
  stroke = 3,
}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'inline-block', verticalAlign: '-0.1em' }}>
    <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SparkIcon: React.FC<{ size?: string | number; color?: string }> = ({ size = '0.9em', color = C.lime }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'inline-block', verticalAlign: '-0.08em' }}>
    <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" fill={color} />
  </svg>
);

export const ArrowIcon: React.FC<{ size?: string | number; color?: string }> = ({ size = '0.9em', color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'inline-block', verticalAlign: '-0.1em' }}>
    <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- Highlight bar ---------- */

export const Highlight: React.FC<{
  children: React.ReactNode;
  start: number;
  dur?: number;
  color?: string;
  height?: string;
  bottom?: string;
}> = ({ children, start, dur = 16, color = C.lime, height = '0.34em', bottom = '0.06em' }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - start, [0, dur], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <span style={{ position: 'relative', display: 'inline-block', zIndex: 0 }}>
      <span
        style={{
          position: 'absolute',
          left: '-0.08em',
          right: '-0.08em',
          bottom,
          height,
          background: color,
          borderRadius: '0.08em',
          transform: `scaleX(${p})`,
          transformOrigin: 'left center',
          zIndex: -1,
        }}
      />
      {children}
    </span>
  );
};

/* ---------- Rich text: *highlight*, \n, ✓ ✦ → ---------- */

type Token = { type: 'text' | 'mark'; text: string } | { type: 'br' };

const tokenize = (s: string): Token[] => {
  const out: Token[] = [];
  s.split('\n').forEach((line, li) => {
    if (li > 0) out.push({ type: 'br' });
    line.split(/(\*[^*]+\*)/).forEach((part) => {
      if (!part) return;
      if (part.startsWith('*') && part.endsWith('*')) out.push({ type: 'mark', text: part.slice(1, -1) });
      else out.push({ type: 'text', text: part });
    });
  });
  return out;
};

const withIcons = (text: string, key: string, iconColor?: string): React.ReactNode[] =>
  text.split(/([✓✦→])/).map((p, i) => {
    if (p === '✓') return <CheckIcon key={`${key}-${i}`} color={iconColor} />;
    if (p === '✦') return <SparkIcon key={`${key}-${i}`} />;
    if (p === '→') return <ArrowIcon key={`${key}-${i}`} />;
    return p ? <React.Fragment key={`${key}-${i}`}>{p}</React.Fragment> : null;
  });

/** Plain text with highlight markup. `markStart` = frame the bar starts to wipe in. */
export const Rich: React.FC<{ text: string; markStart?: number; markStyle?: CSSProperties; iconColor?: string }> = ({
  text,
  markStart = 0,
  markStyle,
  iconColor,
}) => (
  <>
    {tokenize(text).map((t, i) => {
      if (t.type === 'br') return <br key={i} />;
      if (t.type === 'mark')
        return (
          <Highlight key={i} start={markStart}>
            <span style={markStyle}>{withIcons(t.text, `m${i}`, iconColor)}</span>
          </Highlight>
        );
      return <React.Fragment key={i}>{withIcons(t.text, `t${i}`, iconColor)}</React.Fragment>;
    })}
  </>
);

/** Number of typing units in a rich string. */
export const typeLength = (text: string) =>
  tokenize(text).reduce((n, t) => n + (t.type === 'br' ? 0 : clusters(t.text).length), 0);

/**
 * Typed-in rich text. Hidden clusters keep their space so lines never re-flow.
 * Highlight bars start when their word finishes typing.
 */
export const TypeText: React.FC<{ text: string; start: number; perUnit: number; caretColor?: string }> = ({
  text,
  start,
  perUnit,
  caretColor = C.navy,
}) => {
  const frame = useCurrentFrame();
  const shown = Math.floor((frame - start) / perUnit);
  const total = typeLength(text);
  let idx = 0;
  const caretOn = shown < total + 20 && Math.floor(frame / 16) % 2 === 0;

  const renderUnits = (s: string) =>
    clusters(s).map((c) => {
      const i = idx++;
      const visible = i < shown;
      const isLast = i === Math.min(shown, total) - 1;
      return (
        <span key={i} style={{ opacity: visible ? 1 : 0, position: isLast ? 'relative' : undefined }}>
          {c}
          {isLast && caretOn ? (
            <span
              style={{
                position: 'absolute',
                right: '-0.12em',
                top: '0.1em',
                bottom: '0.1em',
                width: '0.07em',
                background: caretColor,
                borderRadius: 4,
              }}
            />
          ) : null}
        </span>
      );
    });

  return (
    <>
      {tokenize(text).map((t, i) => {
        if (t.type === 'br') return <br key={`br${i}`} />;
        if (t.type === 'mark') {
          const before = idx;
          const units = renderUnits(t.text);
          const doneAt = start + (before + clusters(t.text).length) * perUnit;
          return (
            <Highlight key={`m${i}`} start={doneAt + 4}>
              {units}
            </Highlight>
          );
        }
        return <React.Fragment key={`t${i}`}>{renderUnits(t.text)}</React.Fragment>;
      })}
    </>
  );
};
