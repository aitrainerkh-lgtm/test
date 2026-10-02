import React from 'react';
import {Img, staticFile} from 'remotion';
import {hasStaticFile} from '../fonts';
import {theme} from '../theme';

// ---------------- 3D tool icons on pedestals ----------------

const TOOL_STYLE: Record<string, {from: string; to: string; edge: string}> = {
  ChatGPT: {from: '#1DBF95', to: '#0B7C61', edge: '#086049'},
  Claude: {from: '#E8906F', to: '#C4613F', edge: '#9C4729'},
  Gemini: {from: '#5B9BFF', to: '#9A63F2', edge: '#5B3FB8'},
  Copilot: {from: '#2FB4F5', to: '#B455E6', edge: '#6E3AA8'},
};

const ToolGlyph: React.FC<{name: string}> = ({name}) => {
  const white = '#FFFFFF';
  if (name === 'ChatGPT') {
    return (
      <g>
        <path d="M22 28c0-6 5-11 11-11h34c6 0 11 5 11 11v24c0 6-5 11-11 11H44L30 76V63h3c-6 0-11-5-11-11Z" fill={white} />
        <circle cx="38" cy="40" r="5" fill="#0B7C61" />
        <circle cx="50" cy="40" r="5" fill="#0B7C61" />
        <circle cx="62" cy="40" r="5" fill="#0B7C61" />
      </g>
    );
  }
  if (name === 'Claude') {
    const rays = Array.from({length: 10}, (_, i) => i * 36);
    return (
      <g>
        {rays.map((a) => (
          <rect key={a} x="46.5" y="16" width="7" height="34" rx="3.5" fill={white} transform={`rotate(${a} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="8" fill={white} />
      </g>
    );
  }
  if (name === 'Gemini') {
    return <path d="M50 14C52 34 66 48 86 50 66 52 52 66 50 86 48 66 34 52 14 50 34 48 48 34 50 14Z" fill={white} />;
  }
  // Copilot / default: ribbon of two rounded shapes
  return (
    <g>
      <rect x="18" y="30" width="38" height="44" rx="14" fill={white} opacity={0.95} transform="rotate(-12 37 52)" />
      <rect x="44" y="24" width="38" height="44" rx="14" fill="none" stroke={white} strokeWidth="7" transform="rotate(-12 63 46)" />
    </g>
  );
};

/** Glossy "3D" app tile standing on a white pedestal. */
export const ToolIcon: React.FC<{name: string; size: number; image?: string | null}> = ({name, size, image}) => {
  const st = TOOL_STYLE[name] ?? {from: '#5B6CF0', to: theme.navy, edge: '#0C1648'};
  const depth = size * 0.07;
  return (
    <div style={{width: size * 1.35, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      {/* tile */}
      <div style={{position: 'relative', width: size, height: size + depth, zIndex: 2}}>
        <div
          style={{
            position: 'absolute',
            top: depth,
            left: 0,
            width: size,
            height: size,
            borderRadius: size * 0.26,
            background: st.edge,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size * 0.26,
            background: `linear-gradient(145deg, ${st.from}, ${st.to})`,
            overflow: 'hidden',
            boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.35)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '-20%',
              top: '-45%',
              width: '140%',
              height: '80%',
              borderRadius: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0))',
            }}
          />
          {image && hasStaticFile(image) ? (
            <Img src={staticFile(image)} style={{position: 'absolute', inset: '14%', width: '72%', height: '72%', objectFit: 'contain'}} />
          ) : (
            <svg viewBox="0 0 100 100" style={{position: 'absolute', inset: '14%', width: '72%', height: '72%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))'}}>
              <ToolGlyph name={name} />
            </svg>
          )}
        </div>
      </div>
      {/* pedestal */}
      <div style={{position: 'relative', width: size * 1.3, height: size * 0.42, marginTop: -size * 0.12}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: size * 0.09,
            height: size * 0.3,
            borderRadius: `0 0 ${size * 0.65}px ${size * 0.65}px / 0 0 ${size * 0.13}px ${size * 0.13}px`,
            background: 'linear-gradient(180deg, #E9EDF4, #D3D9E4)',
            boxShadow: '0 22px 40px rgba(20,36,107,0.16)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: size * 0.2,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #FFFFFF, #F1F4F9)',
            boxShadow: 'inset 0 -3px 6px rgba(20,36,107,0.06)',
          }}
        />
      </div>
    </div>
  );
};

// ---------------- Line icons for the tools grid ----------------

const LINE_PATHS: Record<string, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  box: <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9" />,
  cart: (
    <>
      <path d="M2.5 4h2.5l2.4 11h10.4L20.5 8H6.3" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="17" cy="19" r="1.6" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H10l-6 4z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth={3} />
    </>
  ),
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />,
  truck: (
    <>
      <path d="M2 6h11v10H2zM13 9.5h4.5l3 3.5v3H13z" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chart: <path d="M3 20h18M6 20v-8M11 20V5M16 20v-11" />,
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M16 15h2M6 6V5a2 2 0 0 1 2-2h9" />
    </>
  ),
  booking: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M8.5 14l2.5 2.5 4.5-4.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M17 13.6c2.6.3 4.5 2.6 4.5 5.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
};

export const LineIcon: React.FC<{name: string; size: number; color?: string}> = ({name, size, color = theme.navy}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {LINE_PATHS[name] ?? LINE_PATHS.plus}
  </svg>
);

// ---------------- Misc icons ----------------

export const TelegramIcon: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <circle cx="24" cy="24" r="24" fill="#2AABEE" />
    <path d="M10.5 23.4 34.6 14c1.1-.4 2.1.3 1.7 2l-4.1 19.3c-.3 1.4-1.1 1.7-2.3 1.1l-6.2-4.6-3 2.9c-.3.3-.6.6-1.3.6l.4-6.3 11.5-10.4c.5-.4-.1-.7-.8-.3l-14.2 9-6.1-1.9c-1.3-.4-1.4-1.3.3-2z" fill="#fff" />
  </svg>
);

export const SheetsIcon: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M5 2h10l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#1E9E5A" />
    <path d="M15 2v5h5z" fill="#8ED1A9" />
    <rect x="6.5" y="10" width="11" height="8" rx="0.8" fill="#fff" />
    <path d="M6.5 12.7h11M6.5 15.3h11M10.5 10v8" stroke="#1E9E5A" strokeWidth="1.1" />
  </svg>
);

export const CursorIcon: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{filter: 'drop-shadow(0 6px 10px rgba(20,36,107,0.3))'}}>
    <path d="M4 2.5 19.5 13l-7 1.3 4 7.2-3 1.6-4-7.3L4 21z" fill={theme.navy} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

export const StoreIcon: React.FC<{size: number; color?: string}> = ({size, color = '#fff'}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5h15L21 9M3 9h18M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M5 12v8h14v-8M10 20v-5h4v5" />
  </svg>
);

export const BottleIcon: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 40 60" width={size * 0.67} height={size}>
    <rect x="15" y="2" width="10" height="7" rx="2" fill="#2D6A2F" />
    <path d="M14 9h12v6c5 3 8 7 8 12v26a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V27c0-5 3-9 8-12z" fill="#F5C842" />
    <path d="M14 9h12v6c5 3 8 7 8 12v26a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V27c0-5 3-9 8-12z" fill="url(#shine)" />
    <rect x="9" y="30" width="22" height="14" rx="2" fill="#fff" />
    <rect x="12" y="34" width="16" height="2.4" rx="1.2" fill={theme.navy} />
    <rect x="12" y="38.5" width="10" height="2" rx="1" fill="#9AA3B5" />
    <defs>
      <linearGradient id="shine" x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);
