import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {config} from '../config';

export type SfxName =
  | 'whoosh'
  | 'swipe'
  | 'pop1'
  | 'pop2'
  | 'pop3'
  | 'pop4'
  | 'click'
  | 'typing'
  | 'message'
  | 'notify'
  | 'success'
  | 'coin'
  | 'print'
  | 'impact'
  | 'sparkle'
  | 'riser';

// Natural length of each sound in frames (60 fps), so sequences end cleanly.
const LENGTH: Record<SfxName, number> = {
  whoosh: 34,
  swipe: 18,
  pop1: 8,
  pop2: 8,
  pop3: 8,
  pop4: 8,
  click: 4,
  typing: 96,
  message: 10,
  notify: 54,
  success: 54,
  coin: 48,
  print: 14,
  impact: 42,
  sparkle: 60,
  riser: 48,
};

/** Plays a sound effect at a frame of the current scene. */
export const Sfx: React.FC<{name: SfxName; at: number; volume?: number; length?: number}> = ({name, at, volume = 1, length}) => {
  if (!config.sfx.enabled) return null;
  return (
    <Sequence from={Math.round(at)} durationInFrames={length ?? LENGTH[name]} layout="none" name={`sfx:${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={config.sfx.volume * volume} />
    </Sequence>
  );
};

/** Pop with a pitch that rises along a list (tiles, chips). */
export const popFor = (i: number): SfxName => (['pop1', 'pop2', 'pop3', 'pop4'] as const)[i % 4];
