import React, {useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sparkles} from 'lucide-react';
import {config} from '../config';
import {hasFile, src} from '../assets';
import {C, FONT_EN, FONT_KH_HEAD, SHADOW} from '../theme';
import {HL, parseMarked} from '../components/ui';

/** Typing units: grapheme clusters, with Khmer subscript (coeng) joined to the next consonant. */
const typingUnits = (s: string) => {
  const seg = new Intl.Segmenter('km', {granularity: 'grapheme'});
  const units: string[] = [];
  for (const {segment} of seg.segment(s)) {
    const prev = units[units.length - 1];
    if (prev && prev.endsWith('្')) units[units.length - 1] = prev + segment;
    else units.push(segment);
  }
  return units;
};

const Caret: React.FC<{visible: boolean}> = ({visible}) => (
  <span style={{position: 'relative', display: 'inline-block', width: 0}}>
    <span
      style={{
        position: 'absolute',
        left: 4,
        top: '0.15em',
        width: 6,
        height: '1.15em',
        borderRadius: 3,
        background: C.lime,
        opacity: visible ? 1 : 0,
      }}
    />
  </span>
);

const TypeText: React.FC<{text: string; start: number; duration: number}> = ({text, start, duration}) => {
  const frame = useCurrentFrame();
  const segments = useMemo(() => {
    let offset = 0;
    return parseMarked(text).map((p) => {
      const units = typingUnits(p.text);
      const s = {...p, units, offset};
      offset += units.length;
      return s;
    });
  }, [text]);
  const total = segments.reduce((a, s) => a + s.units.length, 0);
  const shown = Math.floor(
    interpolate(frame, [start, start + duration], [0, total], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  const typing = shown < total;
  const caretOn = typing || Math.floor(frame / 18) % 2 === 0;

  return (
    <>
      {segments.map((seg, i) => {
        const n = Math.max(0, Math.min(seg.units.length, shown - seg.offset));
        const vis = seg.units.slice(0, n).join('');
        const hid = seg.units.slice(n).join('');
        const caretHere = shown >= seg.offset && (shown < seg.offset + seg.units.length || i === segments.length - 1);
        const inner = (
          <>
            {vis}
            {caretHere && shown < seg.offset + seg.units.length ? <Caret visible={caretOn} /> : null}
            <span style={{opacity: 0}}>{hid}</span>
            {caretHere && shown >= total ? <Caret visible={caretOn && frame < start + duration + 70} /> : null}
          </>
        );
        if (!seg.hl) return <React.Fragment key={i}>{inner}</React.Fragment>;
        const doneAt = start + (duration * (seg.offset + seg.units.length)) / total;
        return (
          <HL key={i} delay={doneAt + 2}>
            {inner}
          </HL>
        );
      })}
    </>
  );
};

/** Built-in illustration used when public/hook.jpg is missing. */
const HookIllustration: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 30) * 8;
  const bubble = (delay: number) =>
    interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: 'linear-gradient(160deg, #FFE7C2 0%, #FCD9A8 35%, #E9EEF9 100%)'}}>
      {/* shop shelves */}
      {[180, 330, 480].map((y, r) => (
        <div key={y} style={{position: 'absolute', left: 0, right: 0, top: y, height: 130, filter: 'blur(5px)', opacity: 0.55}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, background: '#B8875A'}} />
          {Array.from({length: 11}).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 14,
                left: 20 + i * 98,
                width: 70,
                height: 70 + ((i * 37 + r * 13) % 45),
                borderRadius: 10,
                background: ['#E9605A', '#4FA3E0', '#F2B33D', '#7BC86C', '#A07BE0'][(i + r) % 5],
              }}
            />
          ))}
        </div>
      ))}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 55%, rgba(255,255,255,0.0), rgba(255,240,220,0.55) 70%)'}} />
      {/* phone */}
      <div
        style={{
          position: 'absolute',
          left: 340,
          top: 150 + bob,
          width: 400,
          height: 740,
          borderRadius: 60,
          background: C.navy,
          padding: 16,
          boxShadow: '0 40px 80px rgba(20,36,107,0.35)',
          transform: 'rotate(-6deg)',
        }}
      >
        <div style={{width: '100%', height: '100%', borderRadius: 46, background: C.bg, padding: 28, display: 'flex', flexDirection: 'column', gap: 18}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT_EN, fontWeight: 800, color: C.navy, fontSize: 26}}>
            <div style={{width: 50, height: 50, borderRadius: 14, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Sparkles size={30} color={C.navy} />
            </div>
            AI Assistant
          </div>
          {[
            {w: 250, self: true, d: 10},
            {w: 300, self: false, d: 40},
            {w: 200, self: true, d: 75},
            {w: 290, self: false, d: 105},
          ].map((b, i) => (
            <div
              key={i}
              style={{
                alignSelf: b.self ? 'flex-end' : 'flex-start',
                width: b.w,
                height: b.self ? 64 : 110,
                borderRadius: 22,
                background: b.self ? C.navy : C.white,
                boxShadow: SHADOW,
                opacity: bubble(b.d),
                transform: `translateY(${(1 - bubble(b.d)) * 20}px)`,
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const h = config.hook;
  const zoom = interpolate(frame, [0, 4.3 * fps], [1.1, 1.0]);
  const photoIn = interpolate(frame, [0, 12], [0.6, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1060,
          overflow: 'hidden',
          opacity: photoIn,
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
        }}
      >
        <div style={{width: '100%', height: '100%', transform: `scale(${zoom})`}}>
          {hasFile(config.assets.hookPhoto) ? (
            <Img src={src(config.assets.hookPhoto)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <HookIllustration />
          )}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1000,
          left: 70,
          right: 70,
          fontFamily: FONT_KH_HEAD,
          fontWeight: 800,
          fontSynthesis: 'none',
          fontSize: 66,
          lineHeight: 1.75,
          color: C.navy,
          textAlign: 'center',
        }}
      >
        <TypeText text={h.headlineKh} start={Math.round(h.typeStartSec * fps)} duration={Math.round(h.typeDurationSec * fps)} />
      </div>
    </AbsoluteFill>
  );
};
