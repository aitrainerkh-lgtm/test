import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile} from 'remotion';
import './fonts';
import assets from './generated/assets.json';
import {config, SceneKey} from './config';
import {Background, SceneFade} from './components/UI';
import {Karaoke} from './components/Karaoke';
import {OVERLAP, Slot, TIMELINE} from './timeline';
import {Hook} from './scenes/Hook';
import {Title} from './scenes/Title';
import {UseAI} from './scenes/UseAI';
import {Build} from './scenes/Build';
import {MoreTools} from './scenes/MoreTools';
import {Offer} from './scenes/Offer';
import {Close} from './scenes/Close';

const SIMPLE: Partial<Record<SceneKey, React.FC<{duration: number}>>> = {
  hook: Hook,
  title: Title,
  useAI: UseAI,
  moreTools: MoreTools,
  offer: Offer,
  close: Close,
};

const BUILD_KEYS: SceneKey[] = ['stock', 'billing', 'leave', 'agent'];

type Block = {key: string; from: number; duration: number; render: (len: number) => React.ReactNode};

const blocks = (): Block[] => {
  const out: Block[] = [];
  const slots = TIMELINE.slots;
  const buildSlots: Slot[] = slots.filter((s) => BUILD_KEYS.includes(s.key));
  slots.forEach((s) => {
    const Comp = SIMPLE[s.key];
    if (Comp) {
      out.push({key: s.key, from: s.from, duration: s.duration, render: () => <Comp duration={s.duration} />});
    } else if (s.key === BUILD_KEYS[0]) {
      const last = buildSlots[buildSlots.length - 1];
      const duration = last.from + last.duration - s.from;
      out.push({key: 'build', from: s.from, duration, render: (len) => <Build slots={buildSlots} duration={len} />});
    }
  });
  return out;
};

export const PromoVideo: React.FC = () => {
  const list = blocks();
  const total = TIMELINE.total;
  const musicVolume = Math.pow(10, config.timing.musicDb / 20);

  return (
    <AbsoluteFill style={{fontSynthesis: 'none'} as React.CSSProperties}>
      <Background />

      {list.map((b, i) => {
        const last = i === list.length - 1;
        const len = last ? total - b.from : b.duration + OVERLAP;
        return (
          <Sequence key={b.key} from={b.from} durationInFrames={len} name={b.key}>
            <SceneFade duration={len} overlap={OVERLAP} fadeIn={i > 0} fadeOut={!last}>
              {b.render(len)}
            </SceneFade>
          </Sequence>
        );
      })}

      <Karaoke />

      {assets.voiceover && <Audio src={staticFile(assets.voiceover)} />}
      {assets.music && (
        <Audio
          src={staticFile(assets.music)}
          loop
          volume={(f) =>
            musicVolume *
            interpolate(f, [0, 20, total - 60, total], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
          }
        />
      )}
    </AbsoluteFill>
  );
};
