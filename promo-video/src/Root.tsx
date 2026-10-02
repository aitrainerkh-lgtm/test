import React from 'react';
import {Composition} from 'remotion';
import {PromoVideo} from './Video';
import {FPS, TIMELINE} from './timeline';
import {H, W} from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PromoVideo"
    component={PromoVideo}
    durationInFrames={TIMELINE.total}
    fps={FPS}
    width={W}
    height={H}
  />
);
