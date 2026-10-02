import React from 'react';
import {Img, staticFile} from 'remotion';
import assets from '../generated/assets.json';

type ToolId = 'chatgpt' | 'claude' | 'gemini' | 'copilot';

// Stylised, brand-coloured glyphs. Drop official icons into public/icons/<id>.png to replace them.
const Glyph: React.FC<{id: ToolId}> = ({id}) => {
  if (id === 'chatgpt') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect
            key={k}
            x="38"
            y="16"
            width="24"
            height="44"
            rx="12"
            fill="none"
            stroke="#fff"
            strokeWidth="6.5"
            transform={`rotate(${k * 60} 50 50)`}
          />
        ))}
      </svg>
    );
  }
  if (id === 'claude') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {Array.from({length: 12}).map((_, k) => {
          const len = 30 + ((k * 7) % 3) * 5;
          return (
            <line
              key={k}
              x1="50"
              y1="50"
              x2="50"
              y2={50 - len}
              stroke="#D97757"
              strokeWidth="9"
              strokeLinecap="round"
              transform={`rotate(${k * 30 + (k % 2) * 6} 50 50)`}
            />
          );
        })}
      </svg>
    );
  }
  if (id === 'gemini') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <linearGradient id="gem" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1C7DF2" />
            <stop offset="0.55" stopColor="#7B6CF0" />
            <stop offset="1" stopColor="#E06C8A" />
          </linearGradient>
        </defs>
        <path d="M50 4C53 30 70 47 96 50C70 53 53 70 50 96C47 70 30 53 4 50C30 47 47 30 50 4Z" fill="url(#gem)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="copA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A9BF0" />
          <stop offset="1" stopColor="#21C38B" />
        </linearGradient>
        <linearGradient id="copB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2994A" />
          <stop offset="1" stopColor="#B04FE0" />
        </linearGradient>
      </defs>
      <path d="M30 14h24a9 9 0 0 1 8.6 11.6l-14 48A11 11 0 0 1 38 82H20a9 9 0 0 1-8.6-11.6l14-48A9 9 0 0 1 30 14z" fill="url(#copA)" />
      <path d="M70 86H46a9 9 0 0 1-8.6-11.6l14-48A11 11 0 0 1 62 18h18a9 9 0 0 1 8.6 11.6l-14 48A9 9 0 0 1 70 86z" fill="url(#copB)" opacity="0.92" />
    </svg>
  );
};

const FACES: Record<ToolId, {top: string; bottom: string; side: string}> = {
  chatgpt: {top: '#3B3F45', bottom: '#15171A', side: '#08090A'},
  claude: {top: '#FBF6EE', bottom: '#EADBC6', side: '#D6BFA0'},
  gemini: {top: '#FFFFFF', bottom: '#E9EEFA', side: '#C9D3EC'},
  copilot: {top: '#FFFFFF', bottom: '#ECEFF7', side: '#C8CFE2'},
};

/** 3D-style app tile standing on a white pedestal. Size = tile width. */
export const ToolTile3D: React.FC<{id: string; size: number}> = ({id, size: S}) => {
  const tool = id as ToolId;
  const face = FACES[tool];
  const custom = (assets.icons as Record<string, string | null>)[tool];
  return (
    <div style={{position: 'relative', width: S * 1.36, height: S * 1.42}}>
      {/* pedestal shadow */}
      <div
        style={{
          position: 'absolute',
          left: S * 0.02,
          right: S * 0.02,
          top: S * 1.2,
          height: S * 0.24,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(20,36,107,0.22), rgba(20,36,107,0) 70%)',
        }}
      />
      {/* pedestal side */}
      <div
        style={{
          position: 'absolute',
          left: S * 0.08,
          right: S * 0.08,
          top: S * 0.98,
          height: S * 0.3,
          borderRadius: `0 0 ${S * 0.6}px ${S * 0.6}px / 0 0 ${S * 0.13}px ${S * 0.13}px`,
          background: 'linear-gradient(90deg, #DCE2EC, #F7F9FC 45%, #D3DAE6)',
        }}
      />
      {/* pedestal top */}
      <div
        style={{
          position: 'absolute',
          left: S * 0.08,
          right: S * 0.08,
          top: S * 0.86,
          height: S * 0.26,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 40%, #FFFFFF, #EEF1F6)',
          boxShadow: 'inset 0 -3px 0 rgba(20,36,107,0.05)',
        }}
      />
      {/* tile thickness */}
      <div
        style={{
          position: 'absolute',
          left: S * 0.18,
          top: S * 0.07,
          width: S,
          height: S,
          borderRadius: S * 0.26,
          background: face.side,
          boxShadow: `0 ${S * 0.1}px ${S * 0.16}px rgba(20,36,107,0.28)`,
        }}
      />
      {/* tile face */}
      <div
        style={{
          position: 'absolute',
          left: S * 0.18,
          top: 0,
          width: S,
          height: S,
          borderRadius: S * 0.26,
          background: `linear-gradient(160deg, ${face.top}, ${face.bottom})`,
          boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.45), inset 0 -6px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{width: S * 0.6, height: S * 0.6}}>
          {custom ? (
            <Img src={staticFile(custom)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
          ) : (
            <Glyph id={tool} />
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            top: '-55%',
            width: '120%',
            height: '90%',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0))',
          }}
        />
      </div>
    </div>
  );
};
