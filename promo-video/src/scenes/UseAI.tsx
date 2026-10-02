import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, FONT_KH_HEAD} from '../theme';
import {Chip, SectionLabel} from '../components/UI';
import {RichText} from '../components/RichText';
import {ToolTile3D} from '../components/ToolIcons';
import {clamp, enterStyle, springAt} from '../anim';
import {Sfx, popFor} from '../components/Sfx';

const S = 270; // tile size when active
const ICON_Y = 560; // top of the icon block

export const UseAI: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = config.useAI;
  const n = u.tools.length;

  const c0 = 22;
  const endStart = duration - 92;
  const step = (endStart - c0) / n;

  // Carousel position: 0 = first tool centred, n-1 = last tool centred.
  let p = 0;
  for (let k = 1; k < n; k++) p += springAt(frame, fps, c0 + k * step, 110, 17);
  // Final "all four" layout.
  const g = springAt(frame, fps, endStart, 100, 16);
  const carouselIn = springAt(frame, fps, c0 - 10, 120, 16);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 170, width: '100%', display: 'flex', justifyContent: 'center', ...enterStyle(frame, fps, 0)}}>
        <SectionLabel num={u.labelNumber} label={u.label} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 250,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT_KH_HEAD,
          fontSize: 68,
          lineHeight: 1.6,
          color: C.navy,
          ...enterStyle(frame, fps, 6),
        }}
      >
        <RichText text={u.title} />
      </div>

      {u.tools.map((tool, i) => {
        const d = i - p;
        const ad = Math.abs(d);
        const cx = 540 + d * 380 * (0.9 + 0.1 * carouselIn) + (1 - carouselIn) * 500;
        const cs = interpolate(ad, [0, 1, 2], [1, 0.55, 0.4], clamp);
        const co = interpolate(ad, [0, 1, 1.8], [1, 0.45, 0], clamp) * interpolate(frame, [c0 - 10, c0 + 4], [0, 1], clamp);
        const gx = 540 + (i - (n - 1) / 2) * 252;
        const gs = 0.6;
        const x = cx + (gx - cx) * g;
        const sc = cs + (gs - cs) * g;
        const op = co + (1 - co) * g;
        const tileW = S * 1.36;
        return (
          <div
            key={tool.id}
            style={{
              position: 'absolute',
              left: x - tileW / 2,
              top: ICON_Y + (1 - sc) * S * 0.6 + g * 190,
              width: tileW,
              transformOrigin: '50% 0%',
              transform: `scale(${sc})`,
              opacity: op,
              zIndex: Math.round(10 - ad * 2),
            }}
          >
            <ToolTile3D id={tool.id} size={S} />
          </div>
        );
      })}

      {/* Active tool name + chips */}
      {u.tools.map((tool, i) => {
        const near = Math.max(0, 1 - Math.abs(i - p) * 2.6) * (1 - g);
        if (near <= 0.01) return null;
        const at = c0 + i * step;
        return (
          <div key={tool.id} style={{position: 'absolute', top: 970, width: '100%', opacity: near}}>
            <div
              style={{
                textAlign: 'center',
                fontFamily: FONT_EN,
                fontWeight: 800,
                fontSize: 72,
                color: C.navy,
                letterSpacing: -1,
                ...enterStyle(frame, fps, at, {y: 24}),
              }}
            >
              {tool.name}
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 26}}>
              {tool.chips.map((chip, j) => (
                <div key={chip} style={enterStyle(frame, fps, at + 6 + j * 5, {y: 26, scale: 0.2})}>
                  <Chip style={{fontSize: 30, padding: '12px 26px'}}>{chip}</Chip>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* All four names in the final row */}
      {u.tools.map((tool, i) => (
        <div
          key={tool.id}
          style={{
            position: 'absolute',
            top: 1068,
            left: 540 + (i - (n - 1) / 2) * 252 - 120,
            width: 240,
            textAlign: 'center',
            fontFamily: FONT_EN,
            fontWeight: 800,
            fontSize: 36,
            color: C.navy,
            opacity: g,
            transform: `translateY(${(1 - g) * 20}px)`,
          }}
        >
          {tool.name}
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          top: 1200,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          ...enterStyle(frame, fps, endStart + 24),
        }}
      >
        <Chip style={{fontFamily: FONT_KH_BODY, fontSize: 40, padding: '20px 40px', gap: 14}}>
          <RichText text={u.endLine} />
        </Chip>
      </div>

      {u.tools.map((tool, i) => (
        <React.Fragment key={tool.id}>
          {i > 0 && <Sfx name="swipe" at={c0 + i * step - 2} volume={0.75} />}
          {tool.chips.map((chip, j) => (
            <Sfx key={chip} name={popFor(j + i)} at={c0 + i * step + 6 + j * 5} volume={0.35} />
          ))}
        </React.Fragment>
      ))}
      <Sfx name="whoosh" at={endStart - 6} volume={0.5} />
      <Sfx name="sparkle" at={endStart + 24} volume={0.55} />
    </AbsoluteFill>
  );
};
