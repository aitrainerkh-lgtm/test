import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { config } from '../config';
import { enter, sec } from '../lib/anim';
import { Rich } from '../lib/text';
import { Logo, Pill } from '../components/ui';
import { C, FONT, SHADOW } from '../theme';

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const t = config.title;
  const pulse = (Math.sin(frame / 7) + 1) / 2;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 520 }}>
      <div style={{ ...enter(frame, 0) }}>
        <Logo height={92} />
      </div>

      <div style={{ marginTop: 70, ...enter(frame, sec(0.2), { distance: 30 }) }}>
        <Pill style={{ background: '#E6E9F0', color: C.navy }}>
          <span style={{ position: 'relative', width: 20, height: 20 }}>
            <span
              style={{
                position: 'absolute',
                inset: -8 * pulse,
                borderRadius: '50%',
                background: C.red,
                opacity: 0.25 * (1 - pulse),
              }}
            />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.red }} />
          </span>
          <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 30, letterSpacing: 5 }}>{t.liveLabel}</span>
        </Pill>
      </div>

      <div
        style={{
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: 380,
          lineHeight: 1,
          letterSpacing: -14,
          color: C.navy,
          marginTop: 30,
          ...enter(frame, sec(0.35), { distance: 90, scaleFrom: 0.8 }),
        }}
      >
        {t.big}
      </div>

      <div
        style={{
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: 118,
          lineHeight: 1.15,
          letterSpacing: -3,
          color: C.navy,
          ...enter(frame, sec(0.6)),
        }}
      >
        <Rich text={t.second} markStart={sec(0.95)} />
      </div>

      <div style={{ marginTop: 64, ...enter(frame, sec(1.15), { distance: 40 }) }}>
        <Pill style={{ background: C.white, boxShadow: SHADOW, padding: '20px 40px', fontSize: 38, fontWeight: 700, color: C.navy }}>
          <Rich text={t.pill} />
        </Pill>
      </div>
    </AbsoluteFill>
  );
};
