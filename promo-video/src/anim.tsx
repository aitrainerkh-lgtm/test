import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** 0 → 1 progress between two frames, eased. */
export const prog = (frame: number, start: number, dur: number, easing = ease) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing});

export const springAt = (frame: number, fps: number, delay: number, stiffness = 140, damping = 15) =>
  spring({frame: frame - delay, fps, config: {stiffness, damping, mass: 0.9}});

/** Slide-up + fade + slight spring scale entrance. */
export const enterStyle = (
  frame: number,
  fps: number,
  delay: number,
  opts: {y?: number; scale?: number; x?: number} = {},
): React.CSSProperties => {
  const s = springAt(frame, fps, delay);
  const o = interpolate(frame - delay, [0, 12], [0, 1], clamp);
  const y = (opts.y ?? 50) * (1 - s);
  const x = (opts.x ?? 0) * (1 - s);
  const sc = 1 - (opts.scale ?? 0.06) * (1 - s);
  return {opacity: o, transform: `translate(${x}px, ${y}px) scale(${sc})`};
};

export const Enter: React.FC<{
  delay: number;
  y?: number;
  x?: number;
  scale?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({delay, y, x, scale, style, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{...style, ...enterStyle(frame, fps, delay, {y, x, scale})}}>{children}</div>;
};

/** Counts a number between two values. */
export const countTo = (frame: number, start: number, dur: number, from: number, to: number) =>
  Math.round(interpolate(frame, [start, start + dur], [from, to], {...clamp, easing: ease}));

export const usd = (n: number, decimals = 0) =>
  '$' + n.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
