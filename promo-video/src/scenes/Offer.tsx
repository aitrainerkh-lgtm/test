import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY} from '../theme';
import {Logo} from '../components/UI';
import {RichText} from '../components/RichText';
import {clamp, enterStyle, prog, springAt} from '../anim';

export const Offer: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const o = config.offer;
  const k = Math.min(1, duration / 300);
  const at = (f: number) => Math.round(f * k);

  const priceAt = at(40);
  const badge = springAt(frame, fps, at(78), 90, 11);
  const strike = prog(frame, priceAt + 22, 14);
  const pulse = 1 + 0.03 * Math.max(0, Math.sin((frame - at(140)) / 9)) * (frame > at(140) ? 1 : 0);

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 150, ...enterStyle(frame, fps, 0)}}>
        <Logo height={72} />
      </div>

      <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 54, color: C.navy, ...enterStyle(frame, fps, 6)}}>
        <RichText text={o.dateLine} />
      </div>
      <div style={{position: 'absolute', top: 402, width: '100%', textAlign: 'center', fontFamily: FONT_KH_BODY, fontWeight: 400, fontSize: 36, color: C.grey, ...enterStyle(frame, fps, 12)}}>
        <RichText text={o.timeLine} />
      </div>

      <div style={{position: 'absolute', top: 570, left: 76, textAlign: 'left', fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 36, color: C.grey, ...enterStyle(frame, fps, priceAt - 8)}}>
        <RichText text={o.priceLabel} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 630,
          left: 60,
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          ...enterStyle(frame, fps, priceAt, {y: 60, scale: 0.15}),
        }}
      >
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 262, lineHeight: 1, letterSpacing: -9, color: C.navy}}>
          <RichText text={`*${o.price}*`} highlight={prog(frame, priceAt + 12, 20)} barBottom="0.02em" barHeight="0.26em" />
        </div>
        <div style={{position: 'relative', fontFamily: FONT_EN, fontWeight: 700, fontSize: 82, color: C.lightGrey}}>
          {o.oldPrice}
          <span
            style={{
              position: 'absolute',
              left: -6,
              top: '52%',
              height: 8,
              width: `calc(${strike * 100}% + ${12 * strike}px)`,
              background: C.grey,
              borderRadius: 4,
              transform: 'rotate(-10deg)',
            }}
          />
        </div>
      </div>

      {/* Bonus badge */}
      <div
        style={{
          position: 'absolute',
          top: 590,
          right: 30,
          width: 256,
          height: 256,
          opacity: interpolate(frame, [at(78), at(84)], [0, 1], clamp),
          transform: `rotate(${interpolate(badge, [0, 1], [-200, -10])}deg) scale(${badge})`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: C.lime,
            boxShadow: '0 22px 44px rgba(95,179,28,0.40)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: C.navy,
            fontFamily: FONT_EN,
            position: 'relative',
          }}
        >
          <div style={{position: 'absolute', inset: 14, borderRadius: '50%', border: '3px dashed rgba(20,36,107,0.35)'}} />
          <div style={{fontWeight: 800, fontSize: 24, letterSpacing: 6}}>{o.bonusTop}</div>
          <div style={{fontWeight: 800, fontSize: 58, lineHeight: 1.05, letterSpacing: -1}}>{o.bonusMain}</div>
          <div style={{fontWeight: 800, fontSize: 23, lineHeight: 1.2, width: 180}}>{o.bonusBottom}</div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1000,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontFamily: FONT_KH_BODY,
          fontWeight: 400,
          fontSize: 35,
          color: C.navy,
          ...enterStyle(frame, fps, at(100)),
        }}
      >
        <RichText text={o.proofLine} symbolColor={C.successGreen} />
      </div>

      <div style={{position: 'absolute', top: 1130, ...enterStyle(frame, fps, at(120), {y: 60, scale: 0.2})}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            background: C.navy,
            color: '#fff',
            fontFamily: FONT_KH_BODY,
            fontWeight: 700,
            fontSize: 48,
            padding: '30px 66px',
            borderRadius: 999,
            boxShadow: '0 22px 44px rgba(20,36,107,0.30)',
            transform: `scale(${pulse})`,
          }}
        >
          <RichText text={o.button} symbolColor={C.lime} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
