import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {config} from './config';
import {hasStaticFile, loadFonts} from './fonts';
import {CLAMP} from './lib/anim';
import {getScenes, SceneKey, TRANSITION} from './lib/timeline';
import {Background} from './components/Background';
import {Captions} from './components/Captions';
import {SceneShell} from './components/SceneShell';
import {Hook} from './scenes/Hook';
import {Title} from './scenes/Title';
import {UseAI} from './scenes/UseAI';
import {Build} from './scenes/Build';
import {MoreTools} from './scenes/MoreTools';
import {Offer} from './scenes/Offer';
import {Close} from './scenes/Close';

loadFonts();

const SCENES: Record<SceneKey, React.FC> = {
  hook: Hook,
  title: Title,
  useAI: UseAI,
  build: Build,
  moreTools: MoreTools,
  offer: Offer,
  close: Close,
};

const db = (v: number) => Math.pow(10, v / 20);

const AudioTracks: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const A = config.audio;
  const musicBase = db(A.musicVolumeDb);
  return (
    <>
      {hasStaticFile(config.files.music) ? (
        <Audio
          src={staticFile(config.files.music)}
          loop
          volume={(f) =>
            musicBase *
            interpolate(f, [0, A.musicFadeInSec * fps], [0, 1], CLAMP) *
            interpolate(f, [durationInFrames - A.musicFadeOutSec * fps, durationInFrames], [1, 0], CLAMP)
          }
        />
      ) : null}
      {hasStaticFile(config.files.voiceover) ? <Audio src={staticFile(config.files.voiceover)} volume={db(A.voiceVolumeDb)} /> : null}
    </>
  );
};

export const Main: React.FC = () => {
  const scenes = getScenes();
  return (
    <AbsoluteFill style={{fontSynthesis: 'none'}}>
      <Background />
      {scenes.map((s, i) => {
        const Comp = SCENES[s.key];
        const last = i === scenes.length - 1;
        const dur = last ? s.duration : s.duration + TRANSITION;
        return (
          <Sequence key={s.key} from={s.from} durationInFrames={dur} name={s.key}>
            <SceneShell duration={dur} transition={TRANSITION} fadeIn={i > 0} fadeOut={!last}>
              <Comp />
            </SceneShell>
          </Sequence>
        );
      })}
      <Captions />
      <AudioTracks />
    </AbsoluteFill>
  );
};
