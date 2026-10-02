import {config} from './config';

export const C = config.brand.colors;

// Latin glyphs always come from Plus Jakarta Sans. Khmer glyphs fall
// through to the Khmer OS font (if provided) or the Google Fonts fallback.
export const FONT_EN = `'Plus Jakarta Sans', sans-serif`;
export const FONT_KH_HEAD = `'Plus Jakarta Sans', 'Khmer OS Muol Light', 'Moul', sans-serif`;
export const FONT_KH_BODY = `'Plus Jakarta Sans', 'Khmer OS Battambang', 'Battambang', sans-serif`;

export const RADIUS = 16;
export const SHADOW = '0 18px 40px rgba(20, 36, 107, 0.09), 0 3px 8px rgba(20, 36, 107, 0.06)';
export const SHADOW_SOFT = '0 8px 22px rgba(20, 36, 107, 0.07), 0 2px 4px rgba(20, 36, 107, 0.05)';

export const W = config.video.width;
export const H = config.video.height;

export const usd = (n: number, decimals = 2) =>
  '$' + n.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
