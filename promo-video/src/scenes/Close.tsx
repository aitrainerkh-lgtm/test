import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import assets from '../generated/assets.json';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_HEAD, RADIUS, SHADOW_CARD} from '../theme';
import {Logo} from '../components/UI';
import {RichText} from '../components/RichText';
import {TelegramIcon} from '../components/Icons';
import {clamp, enterStyle} from '../anim';
import {Sfx} from '../components/Sfx';

const QR = 520;

export const Close: React.FC<{duration: number}> = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scan = interpolate((frame - 30) % 90, [0, 90], [0, 1], clamp);
  const scanOn = frame > 30 ? 1 : 0;

  const corner = (pos: React.CSSProperties, rot: number) => (
    <div
      style={{
        position: 'absolute',
        width: 70,
        height: 70,
        borderTop: `10px solid ${C.lime}`,
        borderLeft: `10px solid ${C.lime}`,
        borderTopLeftRadius: 24,
        transform: `rotate(${rot}deg)`,
        ...pos,
      }}
    />
  );

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 160, ...enterStyle(frame, fps, 0)}}>
        <Logo height={80} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT_KH_HEAD,
          fontSize: 74,
          lineHeight: 1.6,
          color: C.navy,
          ...enterStyle(frame, fps, 6),
        }}
      >
        <RichText text={config.close.heading} />
      </div>

      <div style={{position: 'absolute', top: 500, ...enterStyle(frame, fps, 14, {y: 80, scale: 0.12})}}>
        <div style={{position: 'relative', background: C.white, borderRadius: RADIUS, boxShadow: SHADOW_CARD, padding: 50}}>
          <div style={{position: 'relative', width: QR, height: QR, overflow: 'hidden'}}>
            <Img src={staticFile(assets.qr)} style={{width: QR, height: QR, objectFit: 'contain', display: 'block'}} />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: scan * QR - 40,
                height: 40,
                opacity: scanOn * 0.9,
                background: 'linear-gradient(180deg, rgba(139,224,60,0), rgba(139,224,60,0.55))',
                borderBottom: `4px solid ${C.lime}`,
              }}
            />
          </div>
          {corner({left: -14, top: -14}, 0)}
          {corner({right: -14, top: -14}, 90)}
          {corner({right: -14, bottom: -14}, 180)}
          {corner({left: -14, bottom: -14}, 270)}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: C.white,
          borderRadius: 999,
          boxShadow: SHADOW_CARD,
          padding: '18px 44px 18px 20px',
          ...enterStyle(frame, fps, 28),
        }}
      >
        <TelegramIcon size={84} />
        <span style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 52, color: C.navy, letterSpacing: -0.5}}>{config.brand.telegram}</span>
      </div>

      <Sfx name="pop2" at={14} volume={0.6} />
      <Sfx name="notify" at={30} volume={0.5} />
    </AbsoluteFill>
  );
};
