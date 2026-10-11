// Synthesizes the sound effects (no stock audio): tones and filtered noise via FFmpeg.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { p } from '../gemini/lib.mjs';

const SFX = {
  // Soft air sweep for scene changes.
  whoosh: ['-f', 'lavfi', '-i', 'anoisesrc=d=0.75:c=pink:a=0.6:r=48000', '-af',
    'highpass=f=250,lowpass=f=2600,afade=t=in:d=0.38:curve=qsin,afade=t=out:st=0.38:d=0.37:curve=qsin,volume=1.6'],
  // Rounded pop for items that appear.
  pop: ['-f', 'lavfi', '-i', "aevalsrc='0.8*sin(2*PI*(420+520*exp(-t*35))*t)*exp(-t*22)':d=0.22:s=48000", '-af', 'afade=t=in:d=0.004'],
  // Light tick for steps and bars.
  tick: ['-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*1500*t)*exp(-t*70)+0.3*sin(2*PI*2250*t)*exp(-t*90)':d=0.09:s=48000", '-af', 'afade=t=in:d=0.002'],
  // Bright two-note chime for a key result.
  chime: ['-f', 'lavfi', '-i', "aevalsrc='0.45*sin(2*PI*988*t)*exp(-t*3.5)+0.3*sin(2*PI*1319*(t-0.09))*exp(-(t-0.09)*3.5)*gt(t,0.09)':d=1.1:s=48000", '-af', 'afade=t=in:d=0.004,afade=t=out:st=0.8:d=0.3'],
  // Warm major chord for the end card.
  outro: ['-f', 'lavfi', '-i', "aevalsrc='0.22*sin(2*PI*523.25*t)*exp(-t*1.2)+0.2*sin(2*PI*659.25*(t-0.12))*exp(-(t-0.12)*1.2)*gt(t,0.12)+0.2*sin(2*PI*783.99*(t-0.24))*exp(-(t-0.24)*1.2)*gt(t,0.24)+0.15*sin(2*PI*1046.5*(t-0.36))*exp(-(t-0.36)*1.4)*gt(t,0.36)':d=2.4:s=48000", '-af', 'afade=t=in:d=0.01,afade=t=out:st=1.9:d=0.5'],
};

export function makeSfx() {
  const dir = p('assets', 'sfx');
  fs.mkdirSync(dir, { recursive: true });
  const out = {};
  for (const [name, args] of Object.entries(SFX)) {
    const file = `${dir}/${name}.wav`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-ac', '2', '-c:a', 'pcm_s16le', file]);
    const d = parseFloat(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])));
    out[name] = { src: `assets/sfx/${name}.wav`, duration: d };
  }
  return out;
}
