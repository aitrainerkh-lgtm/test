import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, RADIUS, SHADOW_SOFT} from '../theme';
import {Enter, RichText} from '../components/ui';
import {ToolTileIcon} from '../components/ToolTileIcon';

export const MoreTools: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = config.moreTools;
  const cols = 3;
  const tileW = 290;
  const tileH = 222;
  const gap = 28;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 150, left: 60, right: 60, textAlign: 'center'}}>
        <Enter delay={0}>
          <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 74, color: C.navy, lineHeight: 1.18}}>
            <RichText text={m.headline} hlDelay={18} />
          </div>
        </Enter>
        <Enter delay={6} style={{marginTop: 14}}>
          <div style={{fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 40, color: C.navySoft, lineHeight: 1.6}}>{m.headlineKh}</div>
        </Enter>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: (1080 - (cols * tileW + (cols - 1) * gap)) / 2,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${tileW}px)`,
          gridAutoRows: `${tileH}px`,
          gap,
        }}
      >
        {m.tiles.map((t, i) => {
          const p = spring({frame: frame - (16 + i * 6), fps, config: {damping: 11, stiffness: 150, mass: 0.8}});
          const isMore = t.icon === 'more';
          return (
            <div
              key={t.label}
              style={{
                background: isMore ? C.navy : C.white,
                borderRadius: RADIUS,
                boxShadow: SHADOW_SOFT,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
                opacity: Math.min(1, p * 1.5),
                transform: `scale(${0.4 + 0.6 * p})`,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 26,
                  background: isMore ? C.lime : C.limeSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ToolTileIcon name={t.icon} size={52} color={C.navy} />
              </div>
              <div
                style={{
                  fontFamily: FONT_EN,
                  fontWeight: 800,
                  fontSize: 32,
                  color: isMore ? C.lime : C.navy,
                  textAlign: 'center',
                  padding: '0 10px',
                }}
              >
                {t.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
