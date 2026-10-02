import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, FONT_KH_HEAD, RADIUS, SHADOW_CARD} from '../theme';
import {RichText} from '../components/RichText';
import {LineIcon} from '../components/LineIcons';
import {enterStyle, prog} from '../anim';
import {Sfx, popFor} from '../components/Sfx';

export const MoreTools: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = config.moreTools;
  const k = Math.min(1, duration / 180);
  const tileStart = Math.round(24 * k);
  const tileStep = Math.max(3, Math.round(6 * k));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 150,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT_KH_HEAD,
          fontSize: 70,
          lineHeight: 1.62,
          color: C.navy,
          ...enterStyle(frame, fps, 0),
        }}
      >
        <RichText text={m.headline} highlight={prog(frame, 12, 18)} barBottom="0.34em" barHeight="0.3em" />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 400,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT_KH_BODY,
          fontWeight: 700,
          fontSize: 42,
          color: C.grey,
          ...enterStyle(frame, fps, 8),
        }}
      >
        <RichText text={m.subline} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 520,
          left: 64,
          right: 64,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 26,
        }}
      >
        {m.tiles.map((tile, i) => (
          <div
            key={tile.label}
            style={{
              position: 'relative',
              height: 206,
              background: C.white,
              borderRadius: RADIUS,
              boxShadow: SHADOW_CARD,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              ...enterStyle(frame, fps, tileStart + i * tileStep, {y: 40, scale: 0.35}),
            }}
          >
            {tile.dot && (
              <span
                style={{position: 'absolute', top: 18, right: 18, width: 18, height: 18, borderRadius: '50%', background: C.lime, boxShadow: '0 0 0 5px rgba(139,224,60,0.25)'}}
              />
            )}
            <LineIcon name={tile.icon} size={70} />
            <div style={{fontFamily: FONT_EN, fontWeight: 700, fontSize: 29, color: C.navy}}>{tile.label}</div>
          </div>
        ))}
      </div>

      <Sfx name="swipe" at={12} volume={0.7} />
      {m.tiles.map((tile, i) => (
        <Sfx key={tile.label} name={popFor(i)} at={tileStart + i * tileStep} volume={0.32} />
      ))}
    </AbsoluteFill>
  );
};
