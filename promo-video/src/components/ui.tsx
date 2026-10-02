import React, { CSSProperties } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { config } from '../config';
import assets from '../generated/assets.json';
import { enter } from '../lib/anim';
import { C, FONT, RADIUS, SHADOW } from '../theme';

export const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: C.bg,
      backgroundImage: `linear-gradient(${C.grid} 2px, transparent 2px), linear-gradient(90deg, ${C.grid} 2px, transparent 2px)`,
      backgroundSize: '72px 72px',
      backgroundPosition: '-1px -1px',
    }}
  >
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(900px 700px at 85% 8%, rgba(139,224,60,0.10), transparent 60%), radial-gradient(900px 800px at 0% 100%, rgba(20,36,107,0.06), transparent 60%)',
      }}
    />
  </AbsoluteFill>
);

export const Card: React.FC<{ style?: CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.white, borderRadius: RADIUS, boxShadow: SHADOW, ...style }}>{children}</div>
);

/** Brand logo: public/logo.png when provided, otherwise a built-in wordmark. */
export const Logo: React.FC<{ height?: number; style?: CSSProperties }> = ({ height = 84, style }) => {
  if (assets.files.logo) {
    return <Img src={staticFile('logo.png')} style={{ height, width: 'auto', objectFit: 'contain', ...style }} />;
  }
  const [first, ...rest] = config.brand.name.split(' ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: height * 0.22, ...style }}>
      <div
        style={{
          width: height,
          height,
          borderRadius: height * 0.26,
          background: C.navy,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 8px 18px rgba(20,36,107,0.25)',
        }}
      >
        <span style={{ fontFamily: FONT.en, fontWeight: 800, color: C.white, fontSize: height * 0.46, letterSpacing: -1 }}>
          {first}
        </span>
        <span
          style={{
            position: 'absolute',
            right: height * 0.14,
            top: height * 0.14,
            width: height * 0.16,
            height: height * 0.16,
            borderRadius: '50%',
            background: C.lime,
          }}
        />
      </div>
      <span style={{ fontFamily: FONT.en, fontWeight: 800, color: C.navy, fontSize: height * 0.44, letterSpacing: -0.5 }}>
        {first} <span style={{ fontWeight: 600 }}>{rest.join(' ')}</span>
      </span>
    </div>
  );
};

/** Green number pill + label, e.g. [01] USE AI */
export const SectionLabel: React.FC<{ number: string; text: string; delay?: number }> = ({ number, text, delay = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...enter(frame, delay, { distance: 30 }) }}>
      <span
        style={{
          background: C.lime,
          color: C.navy,
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: 30,
          padding: '8px 22px',
          borderRadius: 999,
        }}
      >
        {number}
      </span>
      <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: C.navy }}>{text}</span>
    </div>
  );
};

export const Pill: React.FC<{ style?: CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      borderRadius: 999,
      padding: '14px 30px',
      fontFamily: FONT.body,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Scene wrapper: soft fade + blur in and out. */
export const SceneShell: React.FC<{ dur: number; inF?: number; outF?: number; children: React.ReactNode; first?: boolean }> = ({
  dur,
  inF = 14,
  outF = 14,
  first,
  children,
}) => {
  const frame = useCurrentFrame();
  const a = first ? 1 : Math.min(1, frame / inF);
  const b = Math.min(1, Math.max(0, (dur - frame) / outF));
  const v = Math.min(a, b);
  return (
    <AbsoluteFill style={{ opacity: v, filter: v < 1 ? `blur(${(1 - v) * 14}px)` : undefined }}>{children}</AbsoluteFill>
  );
};
