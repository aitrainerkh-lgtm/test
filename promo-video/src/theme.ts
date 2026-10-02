export const C = {
  bg: '#F4F6F9',
  grid: 'rgba(20, 36, 107, 0.045)',
  navy: '#14246B',
  navySoft: '#3A4785',
  lime: '#8BE03C',
  limeSoft: '#E6F8D3',
  limeDeep: '#4E9A12',
  white: '#FFFFFF',
  grey: '#6B7489',
  greyLight: '#B9C0CE',
  line: '#E4E8EF',
  panel: '#F4F6F9',
  red: '#E5484D',
  amber: '#F2A93B',
};

export const FONT = {
  // Plus Jakarta Sans first: English words use it, Khmer falls through to the Khmer font.
  heading: "'Plus Jakarta Sans', 'Khmer OS Muol Light', 'Moul', sans-serif",
  body: "'Plus Jakarta Sans', 'Khmer OS Battambang', 'Battambang', sans-serif",
  khmerBody: "'Khmer OS Battambang', 'Battambang', 'Plus Jakarta Sans', sans-serif",
  en: "'Plus Jakarta Sans', sans-serif",
};

export const RADIUS = 16;
export const SHADOW = '0 18px 40px rgba(20, 36, 107, 0.10), 0 3px 10px rgba(20, 36, 107, 0.06)';
export const SHADOW_SM = '0 8px 20px rgba(20, 36, 107, 0.08), 0 2px 6px rgba(20, 36, 107, 0.05)';

/** Big Khmer headings: Muol for Khmer, bold Plus Jakarta Sans for English words. */
export const HEADING = { fontFamily: FONT.heading, fontWeight: 800, fontSynthesis: 'none' } as const;
