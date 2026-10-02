import {config} from './config';

export const C = config.colors;

// Latin text uses Plus Jakarta Sans; Khmer characters fall through to the Khmer font.
export const FONT_EN = "'Jakarta', 'KhBody', sans-serif";
export const FONT_KH_HEAD = "'Jakarta', 'KhHead', sans-serif";
export const FONT_KH_BODY = "'Jakarta', 'KhBody', sans-serif";

export const RADIUS = 16;

export const SHADOW_CARD =
  '0 24px 48px rgba(20, 36, 107, 0.10), 0 6px 14px rgba(20, 36, 107, 0.06)';
export const SHADOW_SOFT = '0 10px 24px rgba(20, 36, 107, 0.08)';

export const W = 1080;
export const H = 1920;
// Everything above this line is scene content; below is the caption zone.
export const CONTENT_BOTTOM = 1480;
