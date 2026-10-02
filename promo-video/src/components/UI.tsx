import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import assets from '../generated/assets.json';
import {config} from '../config';
import {C, FONT_EN, RADIUS, SHADOW_CARD, SHADOW_SOFT} from '../theme';
import {clamp} from '../anim';

/** #F4F6F9 background with a faint light-grey grid and two slow soft glows. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 180) * 40;
  return (
    <AbsoluteFill style={{background: C.background}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.grid} 2px, transparent 2px), linear-gradient(90deg, ${C.grid} 2px, transparent 2px)`,
          backgroundSize: '72px 72px',
          backgroundPosition: '-1px -1px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          left: -300 + drift,
          top: 1000 - drift,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,224,60,0.13), rgba(139,224,60,0) 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          right: -380 - drift,
          top: -320 + drift,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,36,107,0.07), rgba(20,36,107,0) 65%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Brand logo: public/logo.png when provided, otherwise a clean text logo. */
export const Logo: React.FC<{height?: number; style?: React.CSSProperties}> = ({height = 72, style}) => {
  if (assets.logo) {
    return <Img src={staticFile(assets.logo)} style={{height, width: 'auto', ...style}} />;
  }
  const s = height;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: s * 0.22, ...style}}>
      <div
        style={{
          width: s,
          height: s,
          borderRadius: s * 0.26,
          background: C.navy,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: SHADOW_SOFT,
        }}
      >
        <span style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: s * 0.46, color: '#fff', letterSpacing: -1}}>AI</span>
        <span
          style={{
            position: 'absolute',
            right: s * 0.14,
            top: s * 0.14,
            width: s * 0.16,
            height: s * 0.16,
            borderRadius: '50%',
            background: C.lime,
          }}
        />
      </div>
      <span style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: s * 0.5, color: C.navy, letterSpacing: -0.5}}>
        {config.brand.name}
      </span>
    </div>
  );
};

/** Green number pill + label, e.g. [01] USE AI. */
export const SectionLabel: React.FC<{num: string; label: string; style?: React.CSSProperties}> = ({num, label, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, ...style}}>
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
      {num}
    </div>
    <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 30, color: C.navy, letterSpacing: 4}}>{label}</div>
  </div>
);

export const Card: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <div style={{background: C.white, borderRadius: RADIUS, boxShadow: SHADOW_CARD, ...style}}>{children}</div>
);

export const Chip: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 22px',
      borderRadius: 999,
      background: C.white,
      boxShadow: SHADOW_SOFT,
      fontFamily: FONT_EN,
      fontWeight: 700,
      fontSize: 28,
      color: C.navy,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Soft fade + blur in/out for each scene. */
export const SceneFade: React.FC<{
  duration: number;
  overlap: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({duration, overlap, fadeIn = true, fadeOut = true, children}) => {
  const frame = useCurrentFrame();
  const inP = fadeIn ? interpolate(frame, [0, overlap], [0, 1], clamp) : 1;
  const outP = fadeOut ? interpolate(frame, [duration - overlap, duration], [1, 0], clamp) : 1;
  const blur = (1 - inP) * 14 + (1 - outP) * 14;
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(inP, outP),
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        transform: `scale(${1 + (1 - inP) * 0.025 - (1 - outP) * 0.02})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
