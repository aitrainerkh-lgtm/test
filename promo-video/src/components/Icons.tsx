import React from 'react';
import {C} from '../theme';

type P = {size?: number | string; color?: string; style?: React.CSSProperties};

export const CheckIcon: React.FC<P> = ({size = '1em', color = 'currentColor', style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path d="M4.5 12.5l4.8 4.8L19.5 7" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SparkleIcon: React.FC<P> = ({size = '1em', color = 'currentColor', style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path d="M12 1.5c.7 5.6 4.9 9.8 10.5 10.5-5.6.7-9.8 4.9-10.5 10.5C11.3 16.9 7.1 12.7 1.5 12 7.1 11.3 11.3 7.1 12 1.5z" fill={color} />
  </svg>
);

export const ArrowIcon: React.FC<P> = ({size = '1em', color = 'currentColor', style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SheetsIcon: React.FC<P> = ({size = 40, style}) => (
  <svg width={size} height={size} viewBox="0 0 40 48" style={style}>
    <path d="M4 0h22l14 14v30a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" fill="#1FA463" />
    <path d="M26 0l14 14H30a4 4 0 0 1-4-4z" fill="#86D7AE" />
    <rect x="9" y="22" width="22" height="16" rx="1.5" fill="none" stroke="#fff" strokeWidth="2.6" />
    <path d="M9 30h22M18 22v16" stroke="#fff" strokeWidth="2.6" />
  </svg>
);

export const TelegramIcon: React.FC<P> = ({size = 48, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#37BBFE" />
        <stop offset="1" stopColor="#1E96D3" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="24" fill="url(#tg)" />
    <path d="M10.5 23.4l22.6-8.9c1.1-.4 2 .3 1.7 1.9l-3.8 18c-.3 1.3-1 1.6-2.1 1l-5.8-4.3-2.8 2.7c-.3.3-.6.6-1.2.6l.4-5.9 10.8-9.7c.5-.4-.1-.7-.7-.2l-13.3 8.4-5.7-1.8c-1.2-.4-1.3-1.2.2-1.8z" fill="#fff" />
  </svg>
);

export const MessengerIcon: React.FC<P> = ({size = 48, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <defs>
      <linearGradient id="ms" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#0A7CFF" />
        <stop offset="0.6" stopColor="#A033FF" />
        <stop offset="1" stopColor="#FF5C87" />
      </linearGradient>
    </defs>
    <path d="M24 3C12.2 3 3 11.7 3 23.1c0 6 2.5 11.1 6.5 14.7v7.2l6.6-3.6c2.5.7 5.1 1 7.9 1 11.8 0 21-8.7 21-20.1S35.8 3 24 3z" fill="url(#ms)" />
    <path d="M11 29.5l6.9-11 4.4 3.5 6.5-3.5-6.9 11-4.4-3.5z" fill="#fff" />
  </svg>
);

export const CursorIcon: React.FC<P> = ({size = 64, style}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={style}>
    <path d="M6 3l19 11.5-8.4 1.8 4.8 9.3-3.6 1.8-4.8-9.3L6 24z" fill="#14246B" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const BottleIcon: React.FC<P> = ({size = 80, style}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={style}>
    <rect x="26" y="4" width="12" height="8" rx="2" fill="#E2A417" />
    <path d="M24 12h16v6c5 3 8 7 8 13v25a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V31c0-6 3-10 8-13z" fill="#F6C443" />
    <path d="M20 30h24v18H20z" fill="#fff" opacity="0.9" />
    <path d="M26 39h12" stroke="#E2A417" strokeWidth="3" strokeLinecap="round" />
    <path d="M22 18c-2 3-3 6-3 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
  </svg>
);

/** Inline symbol replacement for ✓ ✦ → inside text. */
export const SymbolIcon: React.FC<{ch: string; color?: string}> = ({ch, color}) => {
  const style: React.CSSProperties = {display: 'inline-block', verticalAlign: '-0.12em'};
  if (ch === '✓') return <CheckIcon size="0.95em" color={color ?? C.limeDark} style={style} />;
  if (ch === '✦') return <SparkleIcon size="0.85em" color={color ?? C.limeDark} style={style} />;
  return <ArrowIcon size="0.95em" color={color} style={style} />;
};
