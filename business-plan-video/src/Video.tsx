import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile} from 'remotion';
import {Background, Captions, Chrome, Line, SceneProps, Sfx, Wipe} from './components';
import {Intro, Sections, What, Why} from './scenes1';
import {AiTools, Compare, Growth, Operating, Outro, Startup, Tip, Who} from './scenes2';
import timing from './timing.json';

const SCENES: Record<string, React.FC<SceneProps>> = {
  intro: Intro,
  what: What,
  sections: Sections,
  why: Why,
  startup: Startup,
  operating: Operating,
  growth: Growth,
  who: Who,
  compare: Compare,
  ai: AiTools,
  tip: Tip,
  outro: Outro,
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading Khmer fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load("60px 'Moul'", 'ក'),
      document.fonts.load("400 30px 'Battambang'", 'ក'),
      document.fonts.load("700 30px 'Battambang'", 'ក'),
      document.fonts.load("500 30px 'Poppins'", 'A'),
      document.fonts.load("700 30px 'Poppins'", 'A'),
      document.fonts.load("800 30px 'Poppins'", 'A'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

export const Video: React.FC = () => {
  useFonts();
  const total = timing.totalFrames;
  const outro = timing.scenes[timing.scenes.length - 1];
  // music sits under the voice; louder before the first line and over the end card
  const firstVoice = timing.scenes[0].voiceAt;
  const outroEnd = outro.from + outro.voiceAt + outro.voiceFrames;
  const musicVolume = (f: number) =>
    interpolate(f, [0, firstVoice, firstVoice + 8, outroEnd, outroEnd + 10, total - 25, total], [0.3, 0.3, 0.1, 0.1, 0.32, 0.32, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  return (
    <AbsoluteFill style={{backgroundColor: '#071423'}}>
      <Background />
      <Audio src={staticFile('audio/music.wav')} volume={musicVolume} />
      {timing.scenes.map((s) => {
        const Scene = SCENES[s.id];
        const lines: Line[] = s.lines;
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
            <Scene lines={lines} duration={s.duration} />
            <Captions lines={lines} />
            <Sequence from={s.voiceAt} layout="none">
              <Audio src={staticFile(`audio/vo_${s.id}.wav`)} volume={1} />
            </Sequence>
          </Sequence>
        );
      })}
      <Chrome total={total} />
      {timing.scenes.slice(1).map((s) => (
        <Sequence key={`w${s.id}`} from={s.from - 7} durationInFrames={16} name={`wipe-${s.id}`}>
          <Wipe />
        </Sequence>
      ))}
      {timing.scenes.slice(1).map((s) => (
        <Sfx key={`s${s.id}`} name="whoosh" at={s.from - 7} volume={0.32} />
      ))}
    </AbsoluteFill>
  );
};
