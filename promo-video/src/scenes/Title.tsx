import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, SHADOW_CARD} from '../theme';
import {Logo} from '../components/UI';
import {RichText} from '../components/RichText';
import {ToolTile3D} from '../components/ToolIcons';
import {Sfx, popFor} from '../components/Sfx';
import {clamp, enterStyle, prog, springAt} from '../anim';

// Small tool tiles floating around the big "AI".
const FLOAT = [
  {id: 'chatgpt', x: 60, y: 520, rot: -10},
  {id: 'claude', x: 860, y: 500, rot: 9},
  {id: 'gemini', x: 80, y: 745, rot: 7},
  {id: 'copilot', x: 855, y: 735, rot: -8},
];
const TILE = 118;

export const Title: React.FC<{duration: number}> = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = config.title;

  const aSpring = springAt(frame, fps, 16, 120, 13);
  const pulse = (frame % 50) / 50;
  const floatStart = 70;
  // Shimmer sweep across "AI", repeating.
  const sweep = ((frame - 40) % 150) / 60;

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 210, ...enterStyle(frame, fps, 2)}}>
        <Logo height={84} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 390,
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

      {FLOAT.map((f, i) => {
        const at = floatStart + i * 7;
        const s = springAt(frame, fps, at, 160, 12);
        const bob = Math.sin((frame - at) / 28 + i * 1.7) * 12;
        return (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              left: f.x,
              top: f.y + bob,
              opacity: interpolate(frame, [at, at + 6], [0, 1], clamp),
              transform: `rotate(${f.rot + Math.sin((frame - at) / 40 + i) * 3}deg) scale(${s})`,
            }}
          >
            <ToolTile3D id={f.id} size={TILE} />
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          top: 480,
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 440,
          lineHeight: 1,
          letterSpacing: -20,
          paddingRight: 20,
          color: 'transparent',
          backgroundImage: `linear-gradient(105deg, ${C.navy} 0%, ${C.navy} 40%, #4A6CF7 47%, ${C.lime} 50%, #4A6CF7 53%, ${C.navy} 60%, ${C.navy} 100%)`,
          backgroundSize: '300% 100%',
          backgroundPosition: `${interpolate(sweep, [0, 1], [100, 0], clamp)}% 0`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          opacity: interpolate(frame, [16, 26], [0, 1], clamp),
          transform: `translateY(${(1 - aSpring) * 80}px) scale(${0.75 + 0.25 * aSpring})`,
        }}
      >
        {t.big}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 940,
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
          top: 1200,
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

      <Sfx name="riser" at={0} volume={0.55} length={18} />
      <Sfx name="impact" at={16} volume={0.9} />
      <Sfx name="pop1" at={8} volume={0.6} />
      <Sfx name="swipe" at={44} volume={0.8} />
      <Sfx name="pop3" at={58} volume={0.7} />
      {FLOAT.map((f, i) => (
        <Sfx key={f.id} name={popFor(i)} at={floatStart + i * 7} volume={0.45} />
      ))}
    </AbsoluteFill>
  );
};
