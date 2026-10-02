import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {theme} from '../theme';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.25) % 72;
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.grid} 2px, transparent 2px), linear-gradient(90deg, ${theme.grid} 2px, transparent 2px)`,
          backgroundSize: '72px 72px',
          backgroundPosition: `0px ${drift}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          left: -300,
          top: 1100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,224,60,0.16), rgba(139,224,60,0) 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          right: -420,
          top: -320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,36,107,0.08), rgba(20,36,107,0) 65%)',
        }}
      />
    </AbsoluteFill>
  );
};
