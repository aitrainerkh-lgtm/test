import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_EN, RADIUS, SHADOW} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Spring progress 0 -> 1 starting at `delay` frames. */
export const useSpring = (delay = 0, damping = 13, stiffness = 110) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, stiffness, mass: 0.9}});
};

/** Linear-eased progress 0 -> 1 between two frames. */
export const useProgress = (start: number, duration: number, ease = Easing.out(Easing.cubic)) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + duration], [0, 1], {...clamp, easing: ease});
};

/** Slide-up + fade + slight spring scale. */
export const Enter: React.FC<{
  delay?: number;
  y?: number;
  scaleFrom?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({delay = 0, y = 60, scaleFrom = 0.92, style, children}) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay);
  const o = interpolate(frame - delay, [0, 14], [0, 1], clamp);
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${(1 - p) * y}px) scale(${scaleFrom + (1 - scaleFrom) * p})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Lime highlight bar that wipes in left to right under a word. */
export const HL: React.FC<{delay?: number; color?: string; thickness?: number; children: React.ReactNode}> = ({
  delay = 0,
  color = C.lime,
  thickness = 0.36,
  children,
}) => {
  const p = useProgress(delay, 20);
  return (
    <span style={{position: 'relative', display: 'inline-block', zIndex: 0}}>
      <span
        style={{
          position: 'absolute',
          left: '-0.08em',
          right: '-0.08em',
          bottom: '0.06em',
          height: `${thickness}em`,
          background: color,
          borderRadius: 8,
          transform: `scaleX(${p})`,
          transformOrigin: 'left center',
          zIndex: -1,
        }}
      />
      {children}
    </span>
  );
};

/** Splits "text [[key]] text" into segments. */
export const parseMarked = (text: string) => {
  const parts: {text: string; hl: boolean}[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({text: text.slice(last, m.index), hl: false});
    parts.push({text: m[1], hl: true});
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({text: text.slice(last), hl: false});
  return parts;
};

/** Removes [[ ]] markers. */
export const plain = (text: string) => text.replace(/\[\[(.+?)\]\]/g, '$1');

/** Renders text with [[highlighted]] words. */
export const RichText: React.FC<{text: string; hlDelay?: number}> = ({text, hlDelay = 0}) => (
  <>
    {parseMarked(text).map((p, i) =>
      p.hl ? (
        <HL key={i} delay={hlDelay}>
          {p.text}
        </HL>
      ) : (
        <React.Fragment key={i}>{p.text}</React.Fragment>
      ),
    )}
  </>
);

export const Pill: React.FC<{
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, bg = C.navy, color = C.white, size = 30, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.4,
      background: bg,
      color,
      fontFamily: FONT_EN,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: size * 0.06,
      padding: `${size * 0.42}px ${size * 0.9}px`,
      borderRadius: 999,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Green number pill + small caps label, e.g. [01] USE AI */
export const SectionLabel: React.FC<{number: string; text: string}> = ({number, text}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 18}}>
    <div
      style={{
        background: C.lime,
        color: C.navy,
        fontFamily: FONT_EN,
        fontWeight: 800,
        fontSize: 30,
        padding: '8px 22px',
        borderRadius: 999,
      }}
    >
      {number}
    </div>
    <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: C.navy}}>
      {text}
    </div>
  </div>
);

export const Card: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <div style={{background: C.white, borderRadius: RADIUS, boxShadow: SHADOW, ...style}}>{children}</div>
);

/** Number that eases from `from` to `to`. */
export const useCount = (from: number, to: number, start: number, duration: number) => {
  const p = useProgress(start, duration, Easing.inOut(Easing.cubic));
  return from + (to - from) * p;
};
