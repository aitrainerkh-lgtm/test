import React from 'react';
import {C} from '../theme';
import {clusters} from '../khmer';
import {SymbolIcon} from './Icons';

type Props = {
  text: string;
  /** 0 → 1: lime highlight bar wipe progress for *starred* words. */
  highlight?: number;
  /** Highlight the last word when the text has no *stars*. */
  autoLast?: boolean;
  /** Typewriter: number of clusters visible (undefined = all). */
  reveal?: number;
  caret?: boolean;
  caretColor?: string;
  /** Distance of the highlight bar from the bottom of the word box. */
  barBottom?: string;
  barHeight?: string;
  symbolColor?: string;
  style?: React.CSSProperties;
};

const SYMBOLS = /(✓|✦|→)/;

type Piece = {text: string; hl: boolean};

const parseLine = (line: string): Piece[] =>
  line.split('*').map((t, i) => ({text: t, hl: i % 2 === 1})).filter((p) => p.text.length);

export const RichText: React.FC<Props> = ({
  text,
  highlight = 0,
  autoLast,
  reveal,
  caret,
  caretColor = C.navy,
  barBottom = '0.1em',
  barHeight = '0.32em',
  symbolColor,
  style,
}) => {
  let src = text;
  if (autoLast && !src.includes('*')) {
    const i = src.lastIndexOf(' ');
    src = i >= 0 ? `${src.slice(0, i + 1)}*${src.slice(i + 1)}*` : `*${src}*`;
  }
  const lines = src.split('\n').map(parseLine);

  let shown = 0;
  let caretPlaced = false;
  const caretEl = (key: string) => (
    <span key={key} style={{position: 'relative', display: 'inline-block', width: 0, height: '1em'}}>
      <span
        style={{
          position: 'absolute',
          left: '0.06em',
          top: '-0.05em',
          width: '0.07em',
          height: '1.1em',
          background: caretColor,
          borderRadius: 4,
        }}
      />
    </span>
  );

  const renderText = (t: string, key: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    t.split(SYMBOLS).forEach((part, pi) => {
      if (!part) return;
      if (SYMBOLS.test(part)) {
        const visible = reveal === undefined || shown < reveal;
        shown++;
        nodes.push(
          <span key={`${key}-s${pi}`} style={{opacity: visible ? 1 : 0}}>
            <SymbolIcon ch={part} color={symbolColor} />
          </span>,
        );
        return;
      }
      if (reveal === undefined) {
        nodes.push(<React.Fragment key={`${key}-t${pi}`}>{part}</React.Fragment>);
        return;
      }
      clusters(part).forEach((c, ci) => {
        const visible = shown < reveal;
        shown++;
        nodes.push(
          <span key={`${key}-${pi}-${ci}`} style={{opacity: visible ? 1 : 0}}>
            {c}
          </span>,
        );
        if (caret && !caretPlaced && shown === reveal) {
          caretPlaced = true;
          nodes.push(caretEl(`${key}-caret`));
        }
      });
    });
    return nodes;
  };

  return (
    <span style={style}>
      {reveal !== undefined && caret && reveal === 0 && caretEl('caret-start')}
      {lines.map((pieces, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {pieces.map((p, pi) =>
            p.hl ? (
              <span key={pi} style={{position: 'relative', display: 'inline-block', zIndex: 0}}>
                <span
                  style={{
                    position: 'absolute',
                    left: '-0.08em',
                    bottom: barBottom,
                    height: barHeight,
                    width: `calc(${Math.max(0, Math.min(1, highlight)) * 100}% + ${0.16 * highlight}em)`,
                    background: C.lime,
                    borderRadius: '0.06em',
                    zIndex: -1,
                  }}
                />
                {renderText(p.text, `${li}-${pi}`)}
              </span>
            ) : (
              <React.Fragment key={pi}>{renderText(p.text, `${li}-${pi}`)}</React.Fragment>
            ),
          )}
        </React.Fragment>
      ))}
    </span>
  );
};

/** Number of typewriter clusters in a text (after removing markup). */
export const clusterCount = (text: string) =>
  text
    .replace(/\*/g, '')
    .split('\n')
    .reduce((n, line) => n + line.split(SYMBOLS).reduce((m, p) => m + (SYMBOLS.test(p) ? 1 : clusters(p).length), 0), 0);
