import React from 'react';
import { Composition } from 'remotion';
import { Promo } from './Promo';
import { FPS } from './lib/anim';
import { TIMING } from './lib/timing';

export const Root: React.FC = () => (
  <Composition id="Promo" component={Promo} durationInFrames={TIMING.total} fps={FPS} width={1080} height={1920} />
);
