import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, F} from './theme';

export type Line = {text: string; at: number};
export type SceneProps = {lines: Line[]; duration: number};

// ------------------------------------------------------------------ helpers
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const useAppear = (at: number, damping = 13, stiffness = 170) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping, stiffness, mass: 0.6}});
};

export const ramp = (frame: number, at: number, len: number) =>
  interpolate(frame, [at, at + len], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

export const currentLine = (lines: Line[], frame: number) => {
  let idx = -1;
  lines.forEach((l, i) => {
    if (frame >= l.at) idx = i;
  });
  return idx;
};

// ------------------------------------------------------------------ sound
export const Sfx: React.FC<{name: string; at: number; volume?: number}> = ({name, at, volume = 0.5}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// ------------------------------------------------------------------ icons
type IconName =
  | 'doc' | 'compass' | 'bulb' | 'coins' | 'chart' | 'target' | 'users' | 'bank' | 'handshake'
  | 'investor' | 'heart' | 'rocket' | 'seed' | 'gear' | 'check' | 'cross' | 'warning' | 'calendar'
  | 'refresh' | 'folder' | 'sparkle' | 'search' | 'table' | 'pen' | 'flag' | 'star' | 'building'
  | 'megaphone' | 'shield' | 'pie' | 'user' | 'kpi' | 'store' | 'globe' | 'box' | 'map';

const P: React.FC<{d: string}> = ({d}) => <path d={d} pathLength={1} />;

const ICONS: Record<IconName, React.ReactNode> = {
  doc: <><P d="M16 6h22l10 10v42H16z" /><P d="M38 6v10h10" /><P d="M22 28h20M22 36h20M22 44h14" /></>,
  compass: <><circle cx="32" cy="32" r="24" pathLength={1} /><P d="M41 23l-6 12-12 6 6-12z" /><P d="M32 8v5M32 51v5M8 32h5M51 32h5" /></>,
  bulb: <><P d="M22 30a10 10 0 1 1 20 0c0 6-5 8-5 14H27c0-6-5-8-5-14z" /><P d="M27 50h10M28 56h8" /><P d="M32 6v4M14 14l3 3M50 14l-3 3" /></>,
  coins: <><ellipse cx="26" cy="20" rx="14" ry="6" pathLength={1} /><P d="M12 20v8c0 3 6 6 14 6s14-3 14-6v-8" /><P d="M12 28v8c0 3 6 6 14 6" /><ellipse cx="40" cy="40" rx="14" ry="6" pathLength={1} /><P d="M26 40v8c0 3 6 6 14 6s14-3 14-6v-8" /></>,
  chart: <><P d="M8 56h50M8 56V8" /><P d="M16 48V36M28 48V28M40 48V20M52 48V12" /><P d="M14 30l12-10 10 6 16-14" /></>,
  target: <><circle cx="30" cy="34" r="22" pathLength={1} /><circle cx="30" cy="34" r="13" pathLength={1} /><circle cx="30" cy="34" r="4" pathLength={1} /><P d="M30 34L54 10M46 10h8v8" /></>,
  users: <><circle cx="24" cy="22" r="8" pathLength={1} /><P d="M8 52c0-10 7-16 16-16s16 6 16 16" /><circle cx="44" cy="24" r="6" pathLength={1} /><P d="M40 36c8 0 16 5 16 14" /></>,
  user: <><circle cx="32" cy="20" r="10" pathLength={1} /><P d="M12 56c0-12 9-20 20-20s20 8 20 20" /></>,
  bank: <><P d="M6 24L32 8l26 16z" /><P d="M12 28v20M24 28v20M40 28v20M52 28v20" /><P d="M6 54h52M8 48h48" /></>,
  handshake: <><P d="M4 28l10-10 10 4 8-4 10 4 10-4 8 10" /><P d="M14 18l-8 18 10 10" /><P d="M50 18l8 18-10 10" /><P d="M22 36l8 8M28 32l9 9M34 30l8 8M20 44l6 6" /></>,
  investor: <><circle cx="32" cy="32" r="24" pathLength={1} /><P d="M38 22c-2-3-12-4-12 2s12 4 12 10-10 6-13 2M32 16v4M32 44v4" /></>,
  heart: <><P d="M32 54S8 40 8 24a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 30-24 30z" /></>,
  rocket: <><P d="M32 6c10 8 14 20 12 34H20C18 26 22 14 32 6z" /><circle cx="32" cy="24" r="5" pathLength={1} /><P d="M20 32l-8 10v8l10-6M44 32l8 10v8l-10-6" /><P d="M26 44l-2 10M32 44v12M38 44l2 10" /></>,
  seed: <><P d="M32 56V28" /><P d="M32 34c-14 0-18-10-18-18 10 0 18 6 18 18z" /><P d="M32 28c0-10 8-16 18-16 0 10-6 16-18 16z" /><P d="M12 56h40" /></>,
  gear: <><circle cx="32" cy="32" r="10" pathLength={1} /><P d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M13.6 50.4l5.7-5.7M44.7 19.3l5.7-5.7" /><circle cx="32" cy="32" r="19" pathLength={1} /></>,
  check: <><P d="M12 34l13 13 27-29" /></>,
  cross: <><P d="M16 16l32 32M48 16L16 48" /></>,
  warning: <><P d="M32 8l26 46H6z" /><P d="M32 26v14M32 46v2" /></>,
  calendar: <><P d="M8 14h48v42H8z" /><P d="M8 26h48M20 8v12M44 8v12" /><P d="M18 36h6M30 36h6M42 36h6M18 46h6M30 46h6" /></>,
  refresh: <><P d="M52 32a20 20 0 1 1-6-14" /><P d="M48 8v12H36" /></>,
  folder: <><P d="M6 16h18l6 6h28v32H6z" /><P d="M6 28h52" /></>,
  sparkle: <><P d="M28 6c2 14 6 18 20 20-14 2-18 6-20 20-2-14-6-18-20-20 14-2 18-6 20-20z" /><P d="M50 40c1 6 3 8 8 9-5 1-7 3-8 9-1-6-3-8-8-9 5-1 7-3 8-9z" /></>,
  search: <><circle cx="27" cy="27" r="17" pathLength={1} /><P d="M40 40l16 16" /></>,
  table: <><P d="M8 10h48v44H8z" /><P d="M8 22h48M8 34h48M8 46h48M24 10v44M40 10v44" /></>,
  pen: <><P d="M42 8l14 14-30 30H12V38z" /><P d="M36 14l14 14" /></>,
  flag: <><P d="M14 58V8" /><P d="M14 10h34l-8 10 8 10H14" /></>,
  star: <><P d="M32 6l7.6 16.4L58 25l-13 12.6L48 56 32 47 16 56l3-18.4L6 25l18.4-2.6z" /></>,
  building: <><P d="M12 58V10h28v48M40 24h14v34M6 58h52" /><P d="M20 18h4M28 18h4M20 28h4M28 28h4M20 38h4M28 38h4M46 34h2M46 44h2" /></>,
  megaphone: <><P d="M8 26v12h8l24 12V14L16 26z" /><P d="M16 38l4 14h6l-3-14" /><P d="M48 24c3 2 4 5 4 8s-1 6-4 8" /></>,
  shield: <><P d="M32 6l22 8v16c0 14-10 22-22 28C20 52 10 44 10 30V14z" /><P d="M22 32l7 7 13-14" /></>,
  pie: <><P d="M28 10a22 22 0 1 0 24 24H28z" /><P d="M36 6v22h22A22 22 0 0 0 36 6z" /></>,
  kpi: <><circle cx="32" cy="36" r="22" pathLength={1} /><P d="M32 36l12-12" /><P d="M14 36h4M46 36h4M32 18v4" /></>,
  store: <><P d="M8 24l6-14h36l6 14z" /><P d="M8 24c0 5 8 5 8 0 0 5 8 5 8 0 0 5 8 5 8 0 0 5 8 5 8 0 0 5 8 5 8 0" /><P d="M12 30v26h40V30M26 56V42h12v14" /></>,
  globe: <><circle cx="32" cy="32" r="24" pathLength={1} /><P d="M8 32h48M32 8c-8 8-8 40 0 48M32 8c8 8 8 40 0 48" /></>,
  box: <><P d="M32 6l24 12v28L32 58 8 46V18z" /><P d="M8 18l24 12 24-12M32 30v28" /></>,
  map: <><P d="M6 14l16-6 20 8 16-6v42l-16 6-20-8-16 6z" /><P d="M22 8v42M42 16v42" /></>,
};

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
  progress?: number;
  stroke?: number;
  style?: React.CSSProperties;
}> = ({name, size = 64, color = C.white, progress = 1, stroke = 3.5, style}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray="1 1"
    strokeDashoffset={1 - Math.min(1, Math.max(0, progress))}
    style={style}
  >
    {ICONS[name]}
  </svg>
);

// ------------------------------------------------------------------ background
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const a = frame / 90;
  const blob = (x: number, y: number, r: number, color: string, phase: number) => (
    <div
      style={{
        position: 'absolute',
        left: x + Math.sin(a + phase) * 80,
        top: y + Math.cos(a * 0.8 + phase) * 60,
        width: r,
        height: r,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.35,
      }}
    />
  );
  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, ${C.bg1} 0%, ${C.bg2} 100%)`, overflow: 'hidden'}}>
      {blob(-200, -250, 900, C.green, 0)}
      {blob(1250, 500, 1000, C.orange, 2)}
      {blob(700, 700, 700, '#2B6CB0', 4)}
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px)',
          backgroundSize: '48px 48px',
          backgroundPosition: `${(frame * 0.6) % 48}px ${(frame * 0.3) % 48}px`,
          opacity: 0.5,
        }}
      />
      {Array.from({length: 18}).map((_, i) => {
        const x = (i * 337) % 1920;
        const speed = 0.6 + (i % 5) * 0.25;
        const y = 1100 - ((frame * speed + i * 140) % 1250);
        const s = 4 + (i % 4) * 3;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: s,
              background: i % 3 === 0 ? C.orange : i % 3 === 1 ? C.green : C.white,
              opacity: 0.35,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ text pieces
export const Kicker: React.FC<{text: string; at?: number; color?: string}> = ({text, at = 0, color = C.orange}) => {
  const p = useAppear(at);
  return (
    <div
      style={{
        fontFamily: F.en,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 6,
        color,
        textTransform: 'uppercase',
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{width: 60 * p, height: 4, background: color, borderRadius: 2}} />
      {text}
    </div>
  );
};

export const Heading: React.FC<{text: string; at?: number; size?: number; color?: string; align?: 'left' | 'center'}> = ({
  text,
  at = 0,
  size = 64,
  color = C.white,
  align = 'left',
}) => {
  const p = useAppear(at, 14, 140);
  return (
    <div
      style={{
        fontFamily: F.head,
        fontSize: size,
        lineHeight: 1.6,
        color,
        textAlign: align,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})`,
        textShadow: '0 6px 30px rgba(0,0,0,0.35)',
      }}
    >
      {text}
    </div>
  );
};

// Bottom caption that follows the narration line by line
export const Captions: React.FC<{lines: Line[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const idx = currentLine(lines, frame);
  if (idx < 0) return null;
  const l = lines[idx];
  const p = ramp(frame, l.at, 6);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 34}}>
      <div
        style={{
          fontFamily: F.kh,
          fontSize: 34,
          lineHeight: 1.75,
          color: C.white,
          background: 'rgba(4,12,24,0.62)',
          border: `1px solid ${C.cardBorder}`,
          padding: '8px 34px',
          borderRadius: 18,
          maxWidth: 1560,
          textAlign: 'center',
          opacity: p,
          transform: `translateY(${(1 - p) * 12}px)`,
        }}
      >
        {l.text}
      </div>
    </AbsoluteFill>
  );
};

// Card used by several scenes
export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({
  children,
  style,
  glow,
}) => (
  <div
    style={{
      background: C.card,
      border: `2px solid ${glow ?? C.cardBorder}`,
      borderRadius: 28,
      boxShadow: glow ? `0 0 40px ${glow}55, 0 20px 50px rgba(0,0,0,0.35)` : '0 20px 50px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(6px)',
      ...style,
    }}
  >
    {children}
  </div>
);

// ------------------------------------------------------------------ frame chrome
export const Chrome: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 0, left: 0, height: 6, width: `${(frame / total) * 100}%`, background: `linear-gradient(90deg, ${C.green}, ${C.orange})`}} />
      <div style={{position: 'absolute', top: 36, right: 48, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.9}}>
        <Logo size={44} />
        <div style={{fontFamily: F.en, fontWeight: 700, fontSize: 24, color: C.white}}>
          AI For <span style={{color: C.orange}}>Business</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{size?: number}> = ({size = 60}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${C.green}, ${C.orange})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: F.en,
      fontWeight: 800,
      fontSize: size * 0.42,
      color: C.white,
      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
    }}
  >
    AI
  </div>
);

// Diagonal two-colour wipe centred on a scene cut
export const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const x1 = interpolate(frame, [0, 7, 15], [-2600, -300, 2400], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const x2 = interpolate(frame, [1, 8, 15], [-2700, -400, 2300], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -300, left: x2, width: 2600, height: 1700, background: C.orange, transform: 'skewX(-18deg)'}} />
      <div style={{position: 'absolute', top: -300, left: x1 + 140, width: 2400, height: 1700, background: C.greenDark, transform: 'skewX(-18deg)'}} />
    </AbsoluteFill>
  );
};
