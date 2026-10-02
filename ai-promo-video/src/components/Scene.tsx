import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';

export const TRANSITION = 18; // frames of soft fade/blur overlap

const Inner: React.FC<{dur: number; fadeIn: boolean; fadeOut: boolean; children: React.ReactNode}> = ({
  dur,
  fadeIn,
  fadeOut,
  children,
}) => {
  const frame = useCurrentFrame();
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const inP = fadeIn ? interpolate(frame, [0, TRANSITION], [0, 1], clamp) : 1;
  const outP = fadeOut ? interpolate(frame, [dur, dur + TRANSITION], [1, 0], clamp) : 1;
  const p = Math.min(inP, outP);
  const blur = (1 - p) * 18;
  const scale = frame < dur ? 1.03 - 0.03 * inP : 0.97 + 0.03 * outP;
  return (
    <AbsoluteFill
      style={{
        opacity: p,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** A scene that fades/blurs in and out, overlapping the next scene. */
export const Scene: React.FC<{
  from: number;
  dur: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  name?: string;
  children: React.ReactNode;
}> = ({from, dur, fadeIn = true, fadeOut = true, name, children}) => (
  <Sequence from={from} durationInFrames={dur + (fadeOut ? TRANSITION : 0)} name={name} layout="none">
    <Inner dur={dur} fadeIn={fadeIn} fadeOut={fadeOut}>
      {children}
    </Inner>
  </Sequence>
);
