import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {hasStaticFile} from '../fonts';
import {enter} from '../lib/anim';
import {fonts, theme} from '../theme';

export const Card: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div
    style={{
      background: theme.white,
      borderRadius: theme.radius,
      boxShadow: theme.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Green pill "01" + label, shown above section titles. */
export const SectionLabel: React.FC<{num: string; text: string; delay?: number}> = ({num, text, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', ...enter(frame, fps, delay, 40)}}>
      <div
        style={{
          background: theme.lime,
          color: theme.navy,
          fontFamily: fonts.en,
          fontWeight: 800,
          fontSize: 34,
          padding: '8px 26px',
          borderRadius: 999,
          letterSpacing: '0.04em',
        }}
      >
        {num}
      </div>
      <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 34, color: theme.navy, letterSpacing: '0.16em'}}>
        {text}
      </div>
    </div>
  );
};

/** Circular logo. Falls back to a wordmark if logo.png is missing. */
export const Logo: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => {
  const file = config.files.logo;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: theme.white,
        boxShadow: theme.shadowSoft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {hasStaticFile(file) ? (
        <Img src={staticFile(file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <div style={{fontFamily: fonts.en, fontWeight: 800, color: theme.navy, fontSize: size * 0.16, textAlign: 'center', lineHeight: 1.1}}>
          {config.brand.name}
        </div>
      )}
    </div>
  );
};

export const Chip: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      background: theme.white,
      border: `2px solid ${theme.line}`,
      borderRadius: 999,
      padding: '10px 24px',
      fontFamily: fonts.en,
      fontWeight: 700,
      fontSize: 28,
      color: theme.navy,
      whiteSpace: 'nowrap',
      boxShadow: theme.shadowSoft,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Full-width centered column helper. */
export const Center: React.FC<{top: number; children: React.ReactNode; style?: React.CSSProperties}> = ({top, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      ...style,
    }}
  >
    {children}
  </div>
);
