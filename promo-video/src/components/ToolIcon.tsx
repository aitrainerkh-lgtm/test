import React from 'react';
import { Img, staticFile } from 'remotion';
import assets from '../generated/assets.json';

/**
 * 3D-style app tiles. These are simple stand-in marks; drop the official icons
 * into public/icons/<id>.png (chatgpt, claude, gemini, copilot) to use those instead.
 */
const Glyph: React.FC<{ id: string }> = ({ id }) => {
  if (id === 'chatgpt') {
    return (
      <svg viewBox="0 0 100 100" width="62%" height="62%">
        {[0, 60, 120, 180, 240, 300].map((r) => (
          <rect
            key={r}
            x="38"
            y="14"
            width="24"
            height="44"
            rx="12"
            fill="none"
            stroke="#fff"
            strokeWidth="6.5"
            transform={`rotate(${r} 50 50)`}
          />
        ))}
      </svg>
    );
  }
  if (id === 'claude') {
    return (
      <svg viewBox="0 0 100 100" width="66%" height="66%">
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2="50"
            y2={i % 2 ? 16 : 10}
            stroke="#fff"
            strokeWidth="8.5"
            strokeLinecap="round"
            transform={`rotate(${i * 30 + 8} 50 50)`}
          />
        ))}
      </svg>
    );
  }
  if (id === 'gemini') {
    return (
      <svg viewBox="0 0 100 100" width="70%" height="70%">
        <defs>
          <linearGradient id="gem" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1C7DF7" />
            <stop offset="0.55" stopColor="#7B61FF" />
            <stop offset="1" stopColor="#E26DCB" />
          </linearGradient>
        </defs>
        <path d="M50 6c3 23 21 41 44 44-23 3-41 21-44 44-3-23-21-41-44-44 23-3 41-21 44-44z" fill="url(#gem)" />
      </svg>
    );
  }
  // copilot
  return (
    <svg viewBox="0 0 100 100" width="66%" height="66%">
      <path d="M28 26h30c8 0 12 4 10 12l-8 30c-2 7-6 10-13 10H17c-7 0-10-4-8-11l8-30c2-7 6-11 11-11z" fill="#fff" opacity="0.95" />
      <path d="M50 36h30c7 0 10 4 8 11l-8 30c-2 7-6 11-11 11H39" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
};

const tiles: Record<string, { bg: string; edge: string }> = {
  chatgpt: { bg: 'linear-gradient(145deg, #2B2F36 0%, #0E1014 100%)', edge: '#05070A' },
  claude: { bg: 'linear-gradient(145deg, #E58A66 0%, #C9643F 100%)', edge: '#A44E2E' },
  gemini: { bg: 'linear-gradient(145deg, #FFFFFF 0%, #EEF1F8 100%)', edge: '#C9D0E0' },
  copilot: { bg: 'linear-gradient(145deg, #2F7BF5 0%, #7A4CF0 55%, #18B5A8 100%)', edge: '#3A2E9E' },
};

export const ToolTile: React.FC<{ id: string; size: number }> = ({ id, size }) => {
  const t = tiles[id] ?? tiles.chatgpt;
  const custom = (assets.files.icons as Record<string, boolean>)[id];
  const r = size * 0.24;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      {/* depth edge */}
      <div style={{ position: 'absolute', inset: 0, top: size * 0.06, borderRadius: r, background: t.edge }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          bottom: size * 0.06,
          borderRadius: r,
          background: custom ? '#fff' : t.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -6px 14px rgba(0,0,0,0.12)',
        }}
      >
        {custom ? (
          <Img src={staticFile(`icons/${id}.png`)} style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
        ) : (
          <Glyph id={id} />
        )}
        {/* glossy highlight */}
        <div
          style={{
            position: 'absolute',
            left: '-20%',
            top: '-60%',
            width: '140%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0))',
          }}
        />
      </div>
    </div>
  );
};

/** White cylinder pedestal under an icon. */
export const Pedestal: React.FC<{ width: number }> = ({ width }) => {
  const h = width * 0.3;
  return (
    <div style={{ width, height: h * 1.35, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: '4%',
          right: '4%',
          bottom: -h * 0.12,
          height: h * 0.5,
          borderRadius: '50%',
          background: 'rgba(20,36,107,0.18)',
          filter: `blur(${width * 0.05}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h * 0.5,
          bottom: 0,
          background: 'linear-gradient(90deg, #E3E7EF 0%, #FFFFFF 45%, #DDE2EC 100%)',
          borderRadius: `0 0 ${width / 2}px ${width / 2}px / 0 0 ${h / 2}px ${h / 2}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: h,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 35%, #FFFFFF 0%, #F1F3F8 70%, #E6EAF2 100%)',
          boxShadow: 'inset 0 -3px 6px rgba(20,36,107,0.06)',
        }}
      />
    </div>
  );
};
