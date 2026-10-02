import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CLAMP} from '../lib/anim';
import {getCaptionPages} from '../lib/timeline';
import {fonts, layout, theme} from '../theme';

/** Karaoke caption in the bottom third, synced word by word. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const pages = useMemo(() => getCaptionPages(), []);
  const page = pages.find((p) => frame >= p.start && frame < p.end);
  if (!page) return null;

  const appear = interpolate(frame - page.start, [0, 8], [0, 1], CLAMP);
  const leave = interpolate(frame, [page.end - 6, page.end], [1, 0], CLAMP);
  const o = Math.min(appear, leave);

  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        top: layout.captionTop,
        display: 'flex',
        justifyContent: 'center',
        opacity: o,
        transform: `translateY(${(1 - appear) * 24}px)`,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.94)',
          borderRadius: theme.radius,
          boxShadow: theme.shadowSoft,
          padding: '22px 34px 26px',
          maxWidth: 980,
          textAlign: 'center',
          fontFamily: fonts.khBody,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.75,
          color: theme.navy,
        }}
      >
        {page.tokens.map((t, i) => {
          const isCurrent = frame >= t.start && frame < t.end;
          const isPast = frame >= t.end;
          const bar = interpolate(frame, [t.start, t.start + 7], [0, 1], CLAMP);
          return (
            <React.Fragment key={i}>
              {t.spaceBefore ? ' ' : null}
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: isCurrent || isPast ? theme.navy : theme.greyLight,
                }}
              >
                {t.text}
                {isCurrent ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 6,
                      height: 8,
                      borderRadius: 4,
                      background: theme.lime,
                      transform: `scaleX(${bar})`,
                      transformOrigin: 'left',
                    }}
                  />
                ) : null}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
