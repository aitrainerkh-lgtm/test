import {continueRender, delayRender, staticFile} from 'remotion';
import {config} from './config';
import {hasFile} from './assets';

/*
 * All fonts load from /public/fonts so renders work offline.
 * - Plus Jakarta Sans (variable, 200-800) for English
 * - Moul / Battambang (Google Fonts) as Khmer fallbacks
 * - Khmer OS Muol Light / Khmer OS Battambang are used first if you add
 *   the .ttf files named in config.assets.
 */

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

type FontDef = {family: string; file: string; weight?: string; unicodeRange?: string; optional?: boolean};

const FONTS: FontDef[] = [
  {family: 'Plus Jakarta Sans', file: 'fonts/PlusJakartaSans-latin.woff2', weight: '200 800', unicodeRange: LATIN},
  {family: 'Plus Jakarta Sans', file: 'fonts/PlusJakartaSans-latin-ext.woff2', weight: '200 800', unicodeRange: LATIN_EXT},
  {family: 'Moul', file: 'fonts/Moul-khmer.woff2', weight: '400'},
  {family: 'Battambang', file: 'fonts/Battambang-400-khmer.woff2', weight: '400'},
  {family: 'Battambang', file: 'fonts/Battambang-700-khmer.woff2', weight: '700'},
  {family: 'Khmer OS Muol Light', file: config.assets.khmerHeadingFont, optional: true},
  {family: 'Khmer OS Battambang', file: config.assets.khmerBodyFont, optional: true},
];

let started = false;

export const ensureFonts = () => {
  if (started) return;
  started = true;
  for (const def of FONTS) {
    if (def.optional && !hasFile(def.file)) continue;
    const handle = delayRender(`Loading font ${def.family} (${def.file})`);
    const face = new FontFace(def.family, `url('${staticFile(def.file)}')`, {
      weight: def.weight ?? 'normal',
      ...(def.unicodeRange ? {unicodeRange: def.unicodeRange} : {}),
    });
    face
      .load()
      .then((f) => {
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(f);
        continueRender(handle);
      })
      .catch((err) => {
        console.warn(`Could not load ${def.file}`, err);
        continueRender(handle);
      });
  }
};
