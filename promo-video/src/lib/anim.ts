import {Easing, interpolate, spring} from 'remotion';

export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const springAt = (
  frame: number,
  fps: number,
  delay = 0,
  cfg: Partial<{damping: number; stiffness: number; mass: number}> = {},
) =>
  spring({
    frame: frame - delay,
    fps,
    config: {damping: 15, stiffness: 140, mass: 0.9, ...cfg},
  });

/** Slide-up + fade + slight spring scale. */
export const enter = (frame: number, fps: number, delay = 0, distance = 70): React.CSSProperties => {
  const s = springAt(frame, fps, delay);
  const o = interpolate(frame - delay, [0, 12], [0, 1], CLAMP);
  return {
    opacity: o,
    transform: `translateY(${(1 - s) * distance}px) scale(${0.92 + 0.08 * s})`,
  };
};

/** 0 -> 1 eased progress between start and start + duration. */
export const prog = (frame: number, start: number, duration: number, easing = Easing.out(Easing.cubic)) =>
  interpolate(frame, [start, start + duration], [0, 1], {...CLAMP, easing});

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const usd = (v: number, decimals = 0) =>
  '$' +
  v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

/** Point along a gentle arc from a to b. */
export const mixPoint = (a: {x: number; y: number}, b: {x: number; y: number}, t: number, arc = 80) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * arc,
});
