import React from 'react';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile } from 'remotion';
import { config } from './config';
import assets from './generated/assets.json';
import { clamp, FPS } from './lib/anim';
import { loadFonts } from './lib/fonts';
import { SCENE_KEYS, SceneKey, TIMING } from './lib/timing';
import { Background, SceneShell } from './components/ui';
import { Caption } from './components/Caption';
import { Hook } from './scenes/Hook';
import { Title } from './scenes/Title';
import { UseAI } from './scenes/UseAI';
import { Build } from './scenes/Build';
import { Close, MoreTools, Offer } from './scenes/Ending';

loadFonts();

const CROSS = 14; // frames of soft fade/blur between scenes

export const Promo: React.FC = () => {
  const w = (k: SceneKey) => TIMING.scenes[SCENE_KEYS.indexOf(k)];
  const buildFrom = w('stock').from;
  const buildTo = w('agent').to;
  const subs = (['stock', 'billing', 'leave', 'agent'] as const).map((k) => ({ from: w(k).from - buildFrom, to: w(k).to - buildFrom }));

  const blocks: Array<{ key: string; from: number; to: number; node: (dur: number) => React.ReactNode }> = [
    { key: 'hook', ...w('hook'), node: () => <Hook /> },
    { key: 'title', ...w('title'), node: () => <Title /> },
    { key: 'useAi', ...w('useAi'), node: (d) => <UseAI dur={d} /> },
    { key: 'build', from: buildFrom, to: buildTo, node: () => <Build subs={subs} /> },
    { key: 'moreTools', ...w('moreTools'), node: () => <MoreTools /> },
    { key: 'offer', ...w('offer'), node: () => <Offer /> },
    { key: 'close', ...w('close'), node: () => <Close /> },
  ];

  const musicVol = Math.pow(10, config.music.volumeDb / 20);
  const total = TIMING.total;

  return (
    <AbsoluteFill>
      <Background />
      {blocks.map((b, i) => {
        const last = i === blocks.length - 1;
        const dur = b.to - b.from;
        return (
          <Sequence key={b.key} from={b.from} durationInFrames={dur + (last ? 0 : CROSS)} name={b.key}>
            <SceneShell dur={last ? dur + 999 : dur + CROSS} first={i === 0} inF={CROSS} outF={CROSS}>
              {b.node(dur)}
            </SceneShell>
          </Sequence>
        );
      })}
      <Caption />

      {assets.files.voiceover ? <Html5Audio src={staticFile(config.voiceover.file)} /> : null}
      {assets.files.music ? (
        <Html5Audio
          src={staticFile(config.music.file)}
          loop
          volume={(f) =>
            musicVol *
            interpolate(f, [0, config.music.fadeInSeconds * FPS], [0, 1], clamp) *
            interpolate(f, [total - config.music.fadeOutSeconds * FPS, total], [1, 0], clamp)
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
