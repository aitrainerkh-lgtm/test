export const theme = {
  bg: '#F4F6F9',
  grid: 'rgba(20, 36, 107, 0.055)',
  navy: '#14246B',
  navySoft: '#2B3A7E',
  lime: '#8BE03C',
  limeSoft: 'rgba(139, 224, 60, 0.18)',
  white: '#FFFFFF',
  grey: '#6B7489',
  greyLight: '#B9C0CD',
  line: '#E3E7EE',
  panel: '#F4F6F9',
  amber: '#F2A93B',
  radius: 16,
  shadow: '0 24px 60px rgba(20, 36, 107, 0.10), 0 6px 16px rgba(20, 36, 107, 0.06)',
  shadowSoft: '0 10px 30px rgba(20, 36, 107, 0.08), 0 2px 6px rgba(20, 36, 107, 0.05)',
};

// Latin text uses Plus Jakarta Sans; Khmer glyphs fall through to the Khmer fonts.
// If "Khmer OS Muol Light" / "Khmer OS Battambang" are installed on the render
// machine (or added to public/fonts, see fonts.ts) they are used first.
export const fonts = {
  en: "'Plus Jakarta Sans', 'Khmer OS Battambang', 'Battambang', sans-serif",
  khHead: "'Plus Jakarta Sans', 'Khmer OS Muol Light', 'Moul', serif",
  khBody: "'Plus Jakarta Sans', 'Khmer OS Battambang', 'Battambang', sans-serif",
};

export const layout = {
  width: 1080,
  height: 1920,
  side: 60,
  /** Captions live below this line. Scene content stays above it. */
  captionTop: 1440,
};
