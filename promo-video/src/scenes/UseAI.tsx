import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { config } from '../config';
import { clamp, enter, pop, sec } from '../lib/anim';
import { Rich } from '../lib/text';
import { Pedestal, ToolTile } from '../components/ToolIcon';
import { SectionLabel } from '../components/ui';
import { C, FONT, HEADING, SHADOW_SM } from '../theme';

const TILE = 290;
const PED = 380;
const GROUP_TOP = 500;
const GROUP_H = TILE + 110;

export const UseAI: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { tools, title, endLine } = config.useAi;
  const n = tools.length;

  const cs = sec(0.55);
  const fe = dur - sec(1.45);
  const per = (fe - cs) / n;
  const soft = { damping: 18, stiffness: 120, mass: 0.9 };

  // carousel position: -1 (off right) -> 0 -> 1 -> ... -> n-1
  let c = -1;
  for (let k = 0; k < n; k++) c += pop(frame, cs + k * per, soft);
  const g = pop(frame, fe, { damping: 16, stiffness: 110 });

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <SectionLabel number={config.course.useAiLabel.number} text={config.course.useAiLabel.text} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 50,
          right: 50,
          textAlign: 'center',
          ...HEADING,
          fontSize: 64,
          lineHeight: 1.6,
          color: C.navy,
          ...enter(frame, sec(0.12)),
        }}
      >
        <Rich text={title} markStart={sec(0.5)} />
      </div>

      {tools.map((tool, i) => {
        const d = i - c;
        const ad = Math.abs(d);
        const cx = d * 370;
        const cScale = interpolate(ad, [0, 1, 2], [1, 0.5, 0.36], clamp);
        const cOp = interpolate(ad, [0, 1, 1.7], [1, 0.42, 0], clamp);
        const fx = (i - (n - 1) / 2) * 238;
        const fScale = 0.6;
        const x = cx + (fx - cx) * g;
        const scale = cScale + (fScale - cScale) * g;
        const op = cOp + (1 - cOp) * g;
        const bob = Math.sin((frame + i * 20) / 22) * 8;
        const blur = (1 - g) * interpolate(ad, [0, 1], [0, 3], clamp);
        return (
          <div
            key={tool.id}
            style={{
              position: 'absolute',
              left: 540 - PED / 2,
              top: GROUP_TOP,
              width: PED,
              height: GROUP_H,
              transform: `translateX(${x}px) scale(${scale})`,
              opacity: op,
              filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              zIndex: 10 - Math.round(ad * 2),
            }}
          >
            <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
              <Pedestal width={PED} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: (PED - TILE) / 2,
                top: bob - 6,
                transform: `perspective(900px) rotateX(8deg) rotateY(${-d * 14 * (1 - g)}deg)`,
              }}
            >
              <ToolTile id={tool.id} size={TILE} />
            </div>
            {/* name under small tiles at the end */}
            <div
              style={{
                position: 'absolute',
                top: GROUP_H + 40,
                left: -100,
                right: -100,
                textAlign: 'center',
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 58,
                color: C.navy,
                opacity: g,
              }}
            >
              {tool.name}
            </div>
          </div>
        );
      })}

      {/* active tool name + chips */}
      {tools.map((tool, i) => {
        const arrive = cs + i * per;
        const vis = interpolate(Math.abs(i - c), [0, 0.45], [1, 0], clamp) * (1 - g);
        if (vis <= 0.01) return null;
        return (
          <div key={tool.id} style={{ position: 'absolute', top: GROUP_TOP + GROUP_H + 30, left: 0, right: 0, opacity: vis }}>
            <div
              style={{
                textAlign: 'center',
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 72,
                color: C.navy,
                letterSpacing: -1,
                ...enter(frame, arrive + 6, { distance: 30 }),
              }}
            >
              {tool.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 26, flexWrap: 'wrap', padding: '0 40px' }}>
              {tool.chips.map((chip, j) => (
                <div
                  key={chip}
                  style={{
                    background: C.white,
                    boxShadow: SHADOW_SM,
                    borderRadius: 999,
                    padding: '14px 26px',
                    fontFamily: FONT.en,
                    fontWeight: 700,
                    fontSize: 32,
                    color: C.navy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    ...enter(frame, arrive + 12 + j * 5, { distance: 24, scaleFrom: 0.8 }),
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.lime }} />
                  {chip}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          top: 1150,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 46,
          color: C.navy,
          ...enter(frame, fe + sec(0.35), { distance: 30 }),
        }}
      >
        <Rich text={endLine} />
      </div>
    </AbsoluteFill>
  );
};
