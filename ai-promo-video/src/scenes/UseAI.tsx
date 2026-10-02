import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, SHADOW_SOFT} from '../theme';
import {Enter, RichText, SectionLabel} from '../components/ui';
import {Pedestal, ToolIcon3D} from '../components/icons';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const UseAI: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = config.useAI;
  const tools = u.tools;
  const n = tools.length;

  // Scene length in frames (from config) shapes the carousel pacing.
  const sceneLen = Math.round((config.scenes.useAI.end - config.scenes.useAI.start) * fps);
  const step = Math.round((sceneLen * 0.68) / n); // time each tool is in focus
  const firstIn = 8;
  const gridAt = firstIn + step * n - 10;

  const sp = (d: number) => spring({frame: frame - d, fps, config: {damping: 16, stiffness: 90, mass: 1}});

  // Continuous carousel index.
  let c = -1 + sp(firstIn);
  for (let k = 1; k < n; k++) c += sp(firstIn + step * k);
  const g = sp(gridAt); // 0 = carousel, 1 = all side by side

  const chipFade = 1 - interpolate(g, [0, 0.4], [0, 1], clamp);
  const gridGap = 250;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
        <Enter delay={0}>
          <SectionLabel number={u.labelNumber} text={u.labelText} />
        </Enter>
        <Enter delay={6} style={{marginTop: 30}}>
          <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 84, color: C.navy, lineHeight: 1.15}}>
            <RichText text={u.title} hlDelay={24} />
          </div>
        </Enter>
        <Enter delay={12} style={{marginTop: 14}}>
          <div style={{fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 42, color: C.navySoft}}>{u.titleKh}</div>
        </Enter>
      </div>

      {tools.map((tool, i) => {
        const offset = i - c; // 0 = centre
        const absO = Math.abs(offset);
        // carousel position
        const cx = offset * 760;
        const cScale = interpolate(absO, [0, 1], [1, 0.62], clamp);
        const cOpacity = interpolate(absO, [0, 0.9, 1.4], [1, 0.5, 0], clamp);
        // grid position
        const gx = (i - (n - 1) / 2) * gridGap;
        const gScale = 0.56;
        const x = cx + (gx - cx) * g;
        const scale = cScale + (gScale - cScale) * g;
        const opacity = cOpacity + (1 - cOpacity) * g;
        const y = 820 + (g * -40);
        const bob = Math.sin((frame + i * 20) / 22) * 10;
        const chipsOpacity = interpolate(absO, [0, 0.35], [1, 0], clamp) * chipFade;

        return (
          <div
            key={tool.id}
            style={{
              position: 'absolute',
              left: 540 + x,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 420,
            }}
          >
            <div style={{position: 'relative', transform: `translateY(${bob}px)`, zIndex: 2}}>
              <ToolIcon3D id={tool.id} size={250} />
            </div>
            <div style={{marginTop: -40}}>
              <Pedestal width={400} />
            </div>
            <div
              style={{
                marginTop: 16,
                fontFamily: FONT_EN,
                fontWeight: 800,
                fontSize: 64 + 20 * g,
                color: C.navy,
              }}
            >
              {tool.name}
            </div>
          </div>
        );
      })}

      {/* chips of the tool in focus */}
      {tools.map((tool, i) => {
        const absO = Math.abs(i - c);
        const o = interpolate(absO, [0, 0.3], [1, 0], clamp) * chipFade;
        if (o <= 0.01) return null;
        return (
          <div
            key={tool.id + '-chips'}
            style={{
              position: 'absolute',
              top: 1230,
              left: 60,
              right: 60,
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 18,
              opacity: o,
            }}
          >
            {tool.chips.map((chip, k) => {
              const focusAt = i === 0 ? firstIn : firstIn + step * i;
              const p = spring({frame: frame - focusAt - 10 - k * 5, fps, config: {damping: 14}});
              return (
                <div
                  key={chip}
                  style={{
                    background: C.white,
                    boxShadow: SHADOW_SOFT,
                    borderRadius: 999,
                    padding: '14px 28px',
                    fontFamily: FONT_EN,
                    fontWeight: 700,
                    fontSize: 34,
                    color: C.navy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
                    opacity: p,
                  }}
                >
                  <span style={{width: 14, height: 14, borderRadius: 99, background: C.lime}} />
                  {chip}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* closing line once all four are side by side */}
      <div style={{position: 'absolute', top: 1170, left: 60, right: 60, textAlign: 'center'}}>
        {frame > gridAt + 6 ? (
          <>
            <Enter delay={gridAt + 8}>
              <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 66, color: C.navy}}>
                <RichText text={u.closingLine} hlDelay={gridAt + 24} />
              </div>
            </Enter>
            <Enter delay={gridAt + 14} style={{marginTop: 14}}>
              <div style={{fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 40, color: C.navySoft}}>{u.closingLineKh}</div>
            </Enter>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
