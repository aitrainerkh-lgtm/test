import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CLAMP} from '../lib/anim';

/** Soft fade + blur in at the start and out at the end of a scene. */
export const SceneShell: React.FC<{
  duration: number;
  transition: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({duration, transition, fadeIn = true, fadeOut = true, children}) => {
  const frame = useCurrentFrame();
  const inP = fadeIn ? interpolate(frame, [0, transition], [0, 1], CLAMP) : 1;
  const outP = fadeOut ? interpolate(frame, [duration - transition, duration], [1, 0], CLAMP) : 1;
  const o = Math.min(inP, outP);
  const blur = (1 - o) * 14;
  return (
    <AbsoluteFill style={{opacity: o, filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>
  );
};
