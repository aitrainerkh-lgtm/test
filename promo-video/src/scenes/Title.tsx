import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, SHADOW_CARD} from '../theme';
import {Logo} from '../components/UI';
import {RichText} from '../components/RichText';
import {clamp, enterStyle, prog, springAt} from '../anim';

export const Title: React.FC<{duration: number}> = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = config.title;

  const aSpring = springAt(frame, fps, 16, 120, 13);
  const pulse = (frame % 50) / 50;

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 230, ...enterStyle(frame, fps, 2)}}>
        <Logo height={84} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 410,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#E4E8F0',
          borderRadius: 999,
          padding: '14px 32px',
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 4,
          color: C.navy,
          ...enterStyle(frame, fps, 8),
        }}
      >
        <span style={{position: 'relative', width: 20, height: 20}}>
          <span style={{position: 'absolute', inset: 0, borderRadius: '50%', background: '#F04438'}} />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid #F04438',
              transform: `scale(${1 + pulse * 1.4})`,
              opacity: 1 - pulse,
            }}
          />
        </span>
        {t.livePill}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 500,
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 440,
          lineHeight: 1,
          letterSpacing: -20,
          color: C.navy,
          opacity: interpolate(frame, [16, 26], [0, 1], clamp),
          transform: `translateY(${(1 - aSpring) * 80}px) scale(${0.75 + 0.25 * aSpring})`,
        }}
      >
        {t.big}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 950,
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 128,
          lineHeight: 1.1,
          letterSpacing: -3,
          color: C.navy,
          ...enterStyle(frame, fps, 30),
        }}
      >
        <RichText text={t.second} highlight={prog(frame, 46, 22)} barBottom="0.06em" barHeight="0.3em" />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1190,
          background: C.white,
          borderRadius: 999,
          boxShadow: SHADOW_CARD,
          padding: '20px 40px',
          fontFamily: FONT_KH_BODY,
          fontWeight: 700,
          fontSize: 38,
          color: C.navy,
          whiteSpace: 'nowrap',
          ...enterStyle(frame, fps, 58),
        }}
      >
        <RichText text={t.noCodePill} />
      </div>
    </AbsoluteFill>
  );
};
