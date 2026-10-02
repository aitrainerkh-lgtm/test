import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.25) % 60;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.grid} 1.5px, transparent 1.5px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: `0 ${drift}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 40%, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%),' +
            'radial-gradient(circle at 8% 92%, rgba(139,224,60,0.10), rgba(139,224,60,0) 35%),' +
            'radial-gradient(circle at 95% 8%, rgba(20,36,107,0.06), rgba(20,36,107,0) 35%)',
        }}
      />
    </AbsoluteFill>
  );
};
