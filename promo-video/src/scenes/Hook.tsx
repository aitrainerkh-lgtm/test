import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import assets from '../generated/assets.json';
import {config} from '../config';
import {C, FONT_KH_BODY, FONT_KH_HEAD} from '../theme';
import {RichText, clusterCount} from '../components/RichText';
import {clamp, enterStyle, prog} from '../anim';

const PHOTO_H = 1000;

/** Shown only when public/hook.jpg is missing: a warm shop scene with a phone. */
const ShopIllustration: React.FC = () => {
  const frame = useCurrentFrame();
  const shelf = (y: number, colors: string[]) =>
    colors.map((c, i) => {
      const w = 92 + ((i * 37) % 40);
      const h = 120 + ((i * 53) % 70);
      const x = 40 + i * 150;
      return <rect key={`${y}-${i}`} x={x} y={y - h} width={w} height={h} rx={10} fill={c} />;
    });
  return (
    <svg width="1080" height={PHOTO_H} viewBox={`0 0 1080 ${PHOTO_H}`}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCE9CF" />
          <stop offset="1" stopColor="#F7D7B0" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEF3FF" />
        </linearGradient>
      </defs>
      <rect width="1080" height={PHOTO_H} fill="url(#wall)" />
      {[300, 540, 780].map((y) => (
        <rect key={y} x="0" y={y} width="1080" height="22" fill="#C98E5A" />
      ))}
      {shelf(300, ['#E85D4A', '#F2B134', '#4FA3E0', '#8BE03C', '#E85D4A', '#F2B134', '#7D6BD8'])}
      {shelf(540, ['#F2B134', '#4FA3E0', '#E85D4A', '#F6C443', '#4FA3E0', '#8BE03C', '#E85D4A'])}
      {shelf(780, ['#7D6BD8', '#E85D4A', '#F2B134', '#4FA3E0', '#F6C443', '#E85D4A', '#4FA3E0'])}
      <rect x="0" y="820" width="1080" height="220" fill="#B97A47" />
      <g transform={`translate(370 ${90 + Math.sin(frame / 30) * 6}) rotate(-6 170 330) scale(0.85)`}>
        <rect x="0" y="0" width="420" height="780" rx="56" fill="#14246B" />
        <rect x="18" y="18" width="384" height="744" rx="42" fill="url(#screen)" />
        <rect x="60" y="90" width="300" height="70" rx="20" fill="#8BE03C" />
        <rect x="60" y="190" width="220" height="56" rx="18" fill="#DDE4F3" />
        <rect x="140" y="270" width="220" height="56" rx="18" fill="#14246B" opacity="0.85" />
        <rect x="60" y="360" width="300" height="180" rx="22" fill="#fff" stroke="#DDE4F3" strokeWidth="4" />
        <rect x="90" y="470" width="40" height="50" rx="6" fill="#8BE03C" />
        <rect x="150" y="430" width="40" height="90" rx="6" fill="#4FA3E0" />
        <rect x="210" y="400" width="40" height="120" rx="6" fill="#14246B" />
        <rect x="270" y="440" width="40" height="80" rx="6" fill="#8BE03C" />
      </g>
    </svg>
  );
};

export const Hook: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {headline, subline} = config.hook;
  const text = headline.join('\n');

  const typeStart = 10;
  const typeEnd = Math.min(100, Math.round(duration * 0.42));
  const total = clusterCount(text);
  const reveal = Math.floor(interpolate(frame, [typeStart, typeEnd], [0, total], clamp));
  const typing = frame < typeEnd + 20;
  const caretOn = typing && Math.floor(frame / 15) % 2 === 0;
  const hl = prog(frame, typeEnd + 4, 20);
  const subDelay = typeEnd + 22;

  const zoom = interpolate(frame, [0, duration], [1.1, 1.0]);
  const photoIn = interpolate(frame, [0, 20], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: PHOTO_H,
          overflow: 'hidden',
          opacity: photoIn,
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 56%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 56%, transparent 100%)',
        }}
      >
        <div style={{transform: `scale(${zoom})`, transformOrigin: '50% 35%', width: '100%', height: '100%'}}>
          {assets.hook ? (
            <Img src={staticFile(assets.hook)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <ShopIllustration />
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 985,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: FONT_KH_HEAD,
          fontSize: 80,
          lineHeight: 1.6,
          fontWeight: 800,
          color: C.navy,
        }}
      >
        <RichText text={text} reveal={reveal} caret={caretOn} highlight={hl} barBottom="0.32em" barHeight="0.3em" />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1325,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: FONT_KH_BODY,
          fontSize: 52,
          fontWeight: 700,
          color: C.grey,
          ...enterStyle(frame, fps, subDelay, {y: 30}),
        }}
      >
        <RichText text={subline} />
      </div>
    </AbsoluteFill>
  );
};
