import { config } from '../config';
import { CSSProperties } from 'react';
import { Easing, interpolate, spring } from 'remotion';

export const FPS = config.timing.fps;
export const sec = (s: number) => Math.round(s * FPS);
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Spring with a slight overshoot - used for every entrance. */
export const pop = (frame: number, delay = 0, config?: { damping?: number; stiffness?: number; mass?: number }) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 13, stiffness: 140, mass: 0.9, ...config } });

/** Slide-up + fade + slight spring scale. */
export const enter = (
  frame: number,
  delay = 0,
  { distance = 60, scaleFrom = 0.92 }: { distance?: number; scaleFrom?: number } = {},
): CSSProperties => {
  const p = pop(frame, delay);
  const o = interpolate(frame - delay, [0, 14], [0, 1], clamp);
  return {
    opacity: o,
    transform: `translateY(${(1 - p) * distance}px) scale(${scaleFrom + (1 - scaleFrom) * p})`,
  };
};

export const fade = (frame: number, from: number, dur = 14) => interpolate(frame - from, [0, dur], [0, 1], clamp);

export const ease = (frame: number, from: number, dur: number) =>
  interpolate(frame - from, [0, dur], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });

/** Count a number from a to b. */
export const countTo = (frame: number, from: number, dur: number, a: number, b: number) =>
  Math.round(a + (b - a) * ease(frame, from, dur));

export const usd = (n: number, decimals = 0) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
