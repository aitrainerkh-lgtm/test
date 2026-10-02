import React from 'react';
import {theme} from '../theme';
import {clusters, parseMarkup} from '../lib/text';

const Check: React.FC<{color?: string}> = ({color = 'currentColor'}) => (
  <svg viewBox="0 0 24 24" style={{width: '0.85em', height: '0.85em', verticalAlign: '-0.08em'}}>
    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Sparkle: React.FC = () => (
  <svg viewBox="0 0 24 24" style={{width: '0.9em', height: '0.9em', verticalAlign: '-0.1em'}}>
    <path d="M12 1.5C12.8 7.5 16.5 11.2 22.5 12 16.5 12.8 12.8 16.5 12 22.5 11.2 16.5 7.5 12.8 1.5 12 7.5 11.2 11.2 7.5 12 1.5Z" fill={theme.lime} />
  </svg>
);

const Arrow: React.FC = () => (
  <svg viewBox="0 0 24 24" style={{width: '0.9em', height: '0.9em', verticalAlign: '-0.12em'}}>
    <path d="M3 12h17M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Replaces ✓ ✦ → with drawn icons so they look the same on every machine. */
export const withSymbols = (s: string, checkColor?: string): React.ReactNode[] =>
  s.split(/([✓✦→])/).map((part, i) => {
    if (part === '✓') return <Check key={i} color={checkColor} />;
    if (part === '✦') return <Sparkle key={i} />;
    if (part === '→') return <Arrow key={i} />;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

/** Lime highlight bar that wipes in left to right behind a word. */
export const Highlight: React.FC<{progress: number; children: React.ReactNode; height?: string; bottom?: string}> = ({
  progress,
  children,
  height = '0.32em',
  bottom = '0.12em',
}) => (
  <span style={{position: 'relative', display: 'inline-block', isolation: 'isolate'}}>
    <span
      style={{
        position: 'absolute',
        left: '-0.08em',
        right: '-0.08em',
        bottom,
        height,
        background: theme.lime,
        borderRadius: 8,
        transform: `scaleX(${progress})`,
        transformOrigin: 'left center',
        zIndex: -1,
      }}
    />
    {children}
  </span>
);

/**
 * Renders text with [highlight] markup and drawn symbols.
 * typed: number of visible clusters (typewriter). Undefined = all visible.
 */
export const Rich: React.FC<{text: string; hl?: number; typed?: number; checkColor?: string}> = ({
  text,
  hl = 1,
  typed,
  checkColor,
}) => {
  let budget = typed ?? Infinity;
  return (
    <>
      {parseMarkup(text).map((seg, i) => {
        const cl = clusters(seg.text);
        const visible = cl.slice(0, Math.max(0, budget)).join('');
        const hidden = cl.slice(Math.max(0, budget)).join('');
        budget -= cl.length;
        const content = (
          <>
            {withSymbols(visible, checkColor)}
            {hidden ? <span style={{opacity: 0}}>{hidden}</span> : null}
          </>
        );
        return seg.hl ? (
          <Highlight key={i} progress={hl}>
            {content}
          </Highlight>
        ) : (
          <React.Fragment key={i}>{content}</React.Fragment>
        );
      })}
    </>
  );
};
