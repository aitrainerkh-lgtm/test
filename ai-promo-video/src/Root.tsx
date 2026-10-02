import React from 'react';
import {Composition} from 'remotion';
import {config} from './config';
import {Promo} from './Promo';

export const RemotionRoot: React.FC = () => {
  const v = config.video;
  return (
    <Composition
      id="PromoVideo"
      component={Promo}
      durationInFrames={Math.round(v.durationSec * v.fps)}
      fps={v.fps}
      width={v.width}
      height={v.height}
    />
  );
};
