import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useVideoConfig} from 'remotion';
import {config} from './config';
import {hasFile} from './assets';
import {ensureFonts} from './fonts';
import {Background} from './components/Background';
import {Scene} from './components/Scene';
import {Captions} from './components/Captions';
import {Hook} from './scenes/Hook';
import {Title} from './scenes/Title';
import {UseAI} from './scenes/UseAI';
import {Build} from './scenes/Build';
import {MoreTools} from './scenes/MoreTools';
import {Offer} from './scenes/Offer';
import {Close} from './scenes/Close';

export const Promo: React.FC = () => {
  ensureFonts();
  const {fps, durationInFrames} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const sc = config.scenes;
  const a = config.audio;

  const scenes: {key: keyof typeof sc; node: React.ReactNode}[] = [
    {key: 'hook', node: <Hook />},
    {key: 'title', node: <Title />},
    {key: 'useAI', node: <UseAI />},
    {key: 'build', node: <Build />},
    {key: 'moreTools', node: <MoreTools />},
    {key: 'offer', node: <Offer />},
    {key: 'close', node: <Close />},
  ];

  return (
    <AbsoluteFill style={{background: config.brand.colors.bg}}>
      <Background />
      {scenes.map(({key, node}, i) => (
        <Scene
          key={key}
          name={key}
          from={f(sc[key].start)}
          dur={f(sc[key].end - sc[key].start)}
          fadeIn={i > 0}
          fadeOut={i < scenes.length - 1}
        >
          {node}
        </Scene>
      ))}
      <Captions />

      {hasFile(config.assets.voiceover) ? (
        <Audio src={staticFile(config.assets.voiceover)} volume={a.voiceoverVolume} />
      ) : null}
      {hasFile(config.assets.music) ? (
        <Audio
          src={staticFile(config.assets.music)}
          loop
          volume={(frame) =>
            a.musicVolume *
            interpolate(
              frame,
              [0, f(a.musicFadeInSec), durationInFrames - f(a.musicFadeOutSec), durationInFrames],
              [0, 1, 1, 0],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
