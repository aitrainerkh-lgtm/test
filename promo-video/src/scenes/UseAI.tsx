import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {CLAMP, enter, mix, springAt} from '../lib/anim';
import {Rich} from '../components/Rich';
import {ToolIcon} from '../components/Icons';
import {Chip, SectionLabel} from '../components/UI';
import {fonts, theme} from '../theme';

const S = config.scenes.useAI;

const TILE = 260;
const FLOOR = 960;
const STEP_START = 30;
const STEP = 46;

export const UseAI: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = S.tools.length;

  // carousel position: -1 = first tool still off to the right
  let a = -1;
  for (let i = 0; i < n; i++) a += springAt(frame, fps, STEP_START + i * STEP, {damping: 18, stiffness: 120});
  const rowStart = STEP_START + n * STEP + 2;
  const p = springAt(frame, fps, rowStart, {damping: 18, stiffness: 110});

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0}}>
        <SectionLabel num={S.labelNumber} text={S.label} delay={4} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 245,
          left: 50,
          right: 50,
          textAlign: 'center',
          fontFamily: fonts.khHead,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.6,
          color: theme.navy,
          ...enter(frame, fps, 12, 40),
        }}
      >
        <Rich text={S.title} />
      </div>

      {S.tools.map((tool, i) => {
        const d = i - a;
        const ad = Math.abs(d);
        const xc = d * 390;
        const sc = interpolate(ad, [0, 1, 2], [1, 0.55, 0.4], CLAMP);
        const oc = interpolate(ad, [0, 1, 1.7], [1, 0.42, 0], CLAMP);
        const xr = (i - (n - 1) / 2) * 245;
        const x = mix(xc, xr, p);
        const s = mix(sc, 0.6, p);
        const o = mix(oc, 1, p);
        const w = TILE * 1.35;
        const chipsO = interpolate(ad, [0, 0.35], [1, 0], CLAMP) * (1 - p);
        return (
          <div key={tool.name}>
            <div
              style={{
                position: 'absolute',
                left: 540 - w / 2,
                top: FLOOR - 370,
                width: w,
                height: 370,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                transform: `translateX(${x}px) scale(${s})`,
                transformOrigin: '50% 100%',
                opacity: o,
                zIndex: Math.round(100 - ad * 10),
              }}
            >
              <ToolIcon name={tool.name} size={TILE} image={tool.icon} />
            </div>

            {/* name (big when active, small in the final row) */}
            <div
              style={{
                position: 'absolute',
                top: FLOOR + 14,
                left: 540 - 200,
                width: 400,
                textAlign: 'center',
                fontFamily: fonts.en,
                fontWeight: 800,
                fontSize: mix(56, 34, p),
                color: theme.navy,
                transform: `translateX(${x}px)`,
                opacity: Math.max(chipsO, p),
              }}
            >
              {tool.name}
            </div>

            {/* feature chips for the active tool */}
            <div
              style={{
                position: 'absolute',
                top: FLOOR + 110,
                left: 40,
                right: 40,
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                opacity: chipsO,
                transform: `translateY(${(1 - chipsO) * 20}px)`,
              }}
            >
              {tool.chips.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          top: FLOOR + 120,
          left: 50,
          right: 50,
          textAlign: 'center',
          fontFamily: fonts.khBody,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.6,
          color: theme.navy,
          ...enter(frame, fps, rowStart + 14, 30),
        }}
      >
        <Rich text={S.endLine} />
      </div>
    </AbsoluteFill>
  );
};
