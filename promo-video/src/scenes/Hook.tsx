import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { config } from '../config';
import assets from '../generated/assets.json';
import { clamp, enter, sec } from '../lib/anim';
import { Rich, TypeText, typeLength } from '../lib/text';
import { C, FONT, HEADING } from '../theme';

/** Stand-in for hook.jpg: a warm, softly lit shop shelf. */
const ShopIllustration: React.FC = () => {
  const shelfColors = [
    ['#F6C35B', '#E7843C', '#8BE03C', '#4C8DF6', '#F6C35B', '#E95F5F', '#7CC7A1'],
    ['#E95F5F', '#F6C35B', '#4C8DF6', '#E7843C', '#7CC7A1', '#F6C35B', '#8BE03C'],
    ['#4C8DF6', '#7CC7A1', '#F6C35B', '#E95F5F', '#E7843C', '#4C8DF6', '#F6C35B'],
  ];
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #FCE9C8 0%, #F8D9A8 55%, #F1C88E 100%)' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(700px 500px at 70% 20%, rgba(255,255,255,0.75), transparent 70%)' }} />
      {shelfColors.map((row, r) => (
        <div key={r} style={{ position: 'absolute', left: 40, right: 40, top: 120 + r * 270 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, height: 200, padding: '0 30px' }}>
            {row.map((c, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 110 + ((i * 37 + r * 23) % 80),
                  background: c,
                  borderRadius: i % 3 === 0 ? '40px 40px 14px 14px' : 14,
                  boxShadow: 'inset 0 10px 0 rgba(255,255,255,0.25), 0 6px 0 rgba(0,0,0,0.06)',
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
          <div style={{ height: 26, background: '#B9824A', borderRadius: 8, boxShadow: '0 12px 20px rgba(80,40,0,0.18)' }} />
        </div>
      ))}
      <AbsoluteFill style={{ backdropFilter: 'blur(5px)' }} />
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { headline, subline } = config.hook;
  const typeStart = sec(0.35);
  const perUnit = Math.max(1, Math.floor(sec(1.7) / typeLength(headline)));
  const typedAt = typeStart + typeLength(headline) * perUnit;
  const zoom = interpolate(frame, [0, sec(4)], [1.1, 1.0], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 1080,
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)',
          opacity: interpolate(frame, [0, 12], [0, 1], clamp),
        }}
      >
        <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
          {assets.files.hook ? (
            <Img src={staticFile('hook.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ShopIllustration />
          )}
        </AbsoluteFill>
      </div>

      <div style={{ position: 'absolute', left: 60, right: 60, top: 880, textAlign: 'center' }}>
        <div
          style={{
            ...HEADING,
            fontSize: 80,
            lineHeight: 1.6,
            color: C.navy,
          }}
        >
          <TypeText text={headline} start={typeStart} perUnit={perUnit} />
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 50,
            color: C.navySoft,
            ...enter(frame, typedAt + sec(0.35), { distance: 30 }),
          }}
        >
          <Rich text={subline} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
