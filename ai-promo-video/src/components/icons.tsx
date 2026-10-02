import React from 'react';
import {Img} from 'remotion';
import {config} from '../config';
import {hasFile, src} from '../assets';
import {FONT_EN} from '../theme';

/* ------------------------------------------------------------------
 * 3D-style AI tool icons. Stylised glyphs in each tool's colours.
 * Drop official PNG icons into public/icons/ to replace them.
 * ------------------------------------------------------------------ */

type ToolId = 'chatgpt' | 'claude' | 'gemini' | 'copilot';

const toolStyle: Record<ToolId, {bg: string; glyph: (s: number) => React.ReactNode}> = {
  chatgpt: {
    bg: 'linear-gradient(145deg, #3a3d46 0%, #111216 100%)',
    glyph: (s) => (
      <svg width={s} height={s} viewBox="-50 -50 100 100">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect
            key={a}
            x={-9}
            y={-38}
            width={18}
            height={44}
            rx={9}
            fill="none"
            stroke="#fff"
            strokeWidth={6}
            transform={`rotate(${a})`}
          />
        ))}
      </svg>
    ),
  },
  claude: {
    bg: 'linear-gradient(145deg, #E8906F 0%, #C9623F 100%)',
    glyph: (s) => (
      <svg width={s} height={s} viewBox="-50 -50 100 100">
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={-4} y={-42} width={8} height={36} rx={4} fill="#fff" transform={`rotate(${i * 30 + (i % 2) * 6})`} />
        ))}
      </svg>
    ),
  },
  gemini: {
    bg: 'linear-gradient(145deg, #5B8DF6 0%, #8A6CE0 55%, #C86FB8 100%)',
    glyph: (s) => (
      <svg width={s} height={s} viewBox="-50 -50 100 100">
        <path d="M0 -44 C 4 -14, 14 -4, 44 0 C 14 4, 4 14, 0 44 C -4 14, -14 4, -44 0 C -14 -4, -4 -14, 0 -44 Z" fill="#fff" />
      </svg>
    ),
  },
  copilot: {
    bg: 'linear-gradient(145deg, #23B5F0 0%, #6F5BF2 55%, #F0609E 100%)',
    glyph: (s) => (
      <svg width={s} height={s} viewBox="-50 -50 100 100">
        <rect x={-38} y={-30} width={48} height={60} rx={16} fill="none" stroke="#fff" strokeWidth={8} />
        <rect x={-10} y={-30} width={48} height={60} rx={16} fill="none" stroke="#fff" strokeWidth={8} opacity={0.85} />
      </svg>
    ),
  },
};

export const ToolIcon3D: React.FC<{id: string; size: number}> = ({id, size}) => {
  const file = (config.assets.toolIcons as Record<string, string>)[id];
  if (hasFile(file)) {
    return (
      <Img
        src={src(file)}
        style={{width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 18px 24px rgba(20,36,107,0.25))'}}
      />
    );
  }
  const t = toolStyle[id as ToolId] ?? toolStyle.chatgpt;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: t.bg,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 ${size * 0.1}px ${size * 0.14}px rgba(20,36,107,0.28), inset 0 -${size * 0.05}px ${size * 0.08}px rgba(0,0,0,0.25), inset 0 ${size * 0.04}px ${size * 0.06}px rgba(255,255,255,0.35)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(170deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%)',
        }}
      />
      <div style={{filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))'}}>{t.glyph(size * 0.56)}</div>
    </div>
  );
};

/** White 3D pedestal. */
export const Pedestal: React.FC<{width: number}> = ({width}) => {
  const top = width * 0.26;
  const body = width * 0.2;
  return (
    <div style={{position: 'relative', width, height: top + body + 30}}>
      <div
        style={{
          position: 'absolute',
          left: width * 0.04,
          right: width * 0.04,
          bottom: 0,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(20,36,107,0.22), rgba(20,36,107,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: top / 2,
          height: body,
          background: 'linear-gradient(90deg, #e4e8f0 0%, #ffffff 45%, #dfe4ee 100%)',
          borderBottomLeftRadius: `${width / 2}px ${top / 2}px`,
          borderBottomRightRadius: `${width / 2}px ${top / 2}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: body,
          height: top,
          borderRadius: '50%',
          background: 'linear-gradient(90deg, #e4e8f0 0%, #ffffff 45%, #dfe4ee 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: top,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f1f3f8 70%, #e3e7ef 100%)',
          boxShadow: 'inset 0 -4px 10px rgba(20,36,107,0.06)',
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ App badges */

export const SheetsIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size * 0.78} height={size} viewBox="0 0 78 100">
    <path d="M8 0 H52 L78 26 V92 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 V8 a8 8 0 0 1 8 -8 Z" fill="#0F9D58" />
    <path d="M52 0 L78 26 H60 a8 8 0 0 1 -8 -8 Z" fill="#87CEAC" />
    <rect x={16} y={44} width={46} height={38} rx={3} fill="#fff" />
    <rect x={20} y={48} width={17} height={8} fill="#0F9D58" />
    <rect x={41} y={48} width={17} height={8} fill="#0F9D58" />
    <rect x={20} y={59} width={17} height={8} fill="#0F9D58" />
    <rect x={41} y={59} width={17} height={8} fill="#0F9D58" />
    <rect x={20} y={70} width={17} height={8} fill="#0F9D58" />
    <rect x={41} y={70} width={17} height={8} fill="#0F9D58" />
  </svg>
);

export const TelegramIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#37BBFE" />
        <stop offset="1" stopColor="#1E96D4" />
      </linearGradient>
    </defs>
    <circle cx={50} cy={50} r={50} fill="url(#tg)" />
    <path d="M22 49 L74 28 C77 27 79 29 78 33 L70 72 C69 76 66 77 63 75 L50 65 L43 72 C42 73 40 73 40 71 L41 60 L66 37 C67 36 66 35 64 36 L34 55 L22 51 C19 50 19 48 22 49 Z" fill="#fff" />
  </svg>
);

export const MessengerIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="ms" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#0A7CFF" />
        <stop offset="0.6" stopColor="#A033FF" />
        <stop offset="1" stopColor="#FF5C87" />
      </linearGradient>
    </defs>
    <path d="M50 6 C25 6 6 24 6 48 C6 61 12 72 22 80 V96 L37 88 C41 89 45 90 50 90 C75 90 94 72 94 48 C94 24 75 6 50 6 Z" fill="url(#ms)" />
    <path d="M22 59 L39 38 C41 36 44 35 46 37 L58 46 L74 36 C76 35 78 37 76 39 L60 60 C58 62 55 63 53 61 L41 52 L25 62 C23 63 21 61 22 59 Z" fill="#fff" />
  </svg>
);

export const KHQRBadge: React.FC<{size?: number}> = ({size = 34}) => (
  <div
    style={{
      fontFamily: FONT_EN,
      fontWeight: 800,
      fontSize: size,
      color: '#fff',
      letterSpacing: 2,
    }}
  >
    KHQR
  </div>
);
