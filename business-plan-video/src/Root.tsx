import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import timing from './timing.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BusinessPlanVideo"
    component={Video}
    durationInFrames={timing.totalFrames}
    fps={timing.fps}
    width={1920}
    height={1080}
  />
);
