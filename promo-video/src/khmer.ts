const COENG = '្';

/** Splits text into visible clusters, keeping Khmer subscript consonants with their base. */
export const clusters = (text: string): string[] => {
  const seg = new Intl.Segmenter('km', {granularity: 'grapheme'});
  const out: string[] = [];
  for (const {segment} of seg.segment(text)) {
    const prev = out[out.length - 1];
    if (prev && prev.endsWith(COENG)) out[out.length - 1] = prev + segment;
    else out.push(segment);
  }
  return out;
};

export type Token = {text: string; phraseEnd: boolean; weight: number};

const isKhmer = (ch: string) => /[ក-៿]/.test(ch);

const tokenWeight = (t: string) => {
  let w = 0;
  for (const c of clusters(t)) {
    if (/[\s.,!?។៕]/.test(c)) continue;
    w += isKhmer(c) ? 1 : 0.55;
  }
  return Math.max(w, 0.8);
};

/** Splits a voiceover line into karaoke words. "|" forces a word break. */
export const tokenize = (line: string): Token[] => {
  const words = new Intl.Segmenter('km', {granularity: 'word'});
  const tokens: Token[] = [];
  const phrases = line.split(/\s+/).filter(Boolean);
  phrases.forEach((phrase) => {
    const parts: string[] = [];
    if (phrase.includes('|')) {
      parts.push(...phrase.split('|').filter(Boolean));
    } else {
      for (const s of words.segment(phrase)) {
        // Punctuation sticks to the word before it.
        if (!s.isWordLike && parts.length) parts[parts.length - 1] += s.segment;
        else parts.push(s.segment);
      }
    }
    parts.forEach((p, i) =>
      tokens.push({text: p, phraseEnd: i === parts.length - 1, weight: tokenWeight(p)}),
    );
  });
  return tokens;
};
