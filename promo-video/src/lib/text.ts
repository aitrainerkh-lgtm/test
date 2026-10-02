export type Seg = {text: string; hl: boolean};

/** "បង្កើត [Tools] បន្ថែម" -> segments, [..] marks the highlighted word. */
export const parseMarkup = (s: string): Seg[] => {
  const out: Seg[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({text: s.slice(last, m.index), hl: false});
    out.push({text: m[1], hl: true});
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({text: s.slice(last), hl: false});
  return out;
};

export const stripMarkup = (s: string) => s.replace(/\[|\]/g, '');

const COENG = '្';

/**
 * Splits text into visual clusters. Khmer subscript consonants (coeng + consonant)
 * are kept with their base so a typewriter never shows a broken cluster.
 */
export const clusters = (s: string): string[] => {
  const seg = new Intl.Segmenter('km', {granularity: 'grapheme'});
  const raw = Array.from(seg.segment(s), (x) => x.segment);
  const out: string[] = [];
  for (const g of raw) {
    const prev = out[out.length - 1];
    if (prev !== undefined && (prev.endsWith(COENG) || /^[ា-៓៝]/.test(g))) {
      out[out.length - 1] = prev + g;
    } else {
      out.push(g);
    }
  }
  return out;
};
