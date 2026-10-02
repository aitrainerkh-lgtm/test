import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {hasStaticFile} from '../fonts';
import {CLAMP, enter, prog} from '../lib/anim';
import {clusters, stripMarkup} from '../lib/text';
import {Rich} from '../components/Rich';
import {fonts, theme} from '../theme';

const S = config.scenes.hook;

const PhotoPlaceholder: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #FDE7CF 0%, #F7D9C4 35%, #DCEFD0 100%)'}}>
    <div style={{position: 'absolute', left: 120, top: 180, width: 520, height: 520, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', filter: 'blur(40px)'}} />
    <div style={{position: 'absolute', right: 80, top: 420, width: 420, height: 420, borderRadius: '50%', background: 'rgba(139,224,60,0.25)', filter: 'blur(50px)'}} />
  </AbsoluteFill>
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const photo = config.files.hookPhoto;

  // Headline types in cluster by cluster, line after line.
  const TYPE_START = 14;
  const PER_CLUSTER = 1.6;
  const lines = S.headline;
  const lineLens = lines.map((l) => clusters(stripMarkup(l)).length);
  const typedTotal = Math.max(0, (frame - TYPE_START) / PER_CLUSTER);
  const typeEnd = TYPE_START + lineLens.reduce((a, b) => a + b, 0) * PER_CLUSTER;
  const hl = prog(frame, typeEnd + 4, 18);

  const zoom = interpolate(frame, [0, 260], [1.08, 1.0], CLAMP);

  let before = 0;
  return (
    <AbsoluteFill>
      {/* photo, top half, fading into background */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: 1060,
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 100%)',
          opacity: interpolate(frame, [0, 10], [0, 1], CLAMP),
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`}}>
          {hasStaticFile(photo) ? (
            <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%'}} />
          ) : (
            <PhotoPlaceholder />
          )}
        </div>
      </div>

      {/* headline */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 930,
          textAlign: 'center',
          fontFamily: fonts.khHead,
          fontWeight: 800,
          fontSize: 74,
          lineHeight: 1.6,
          color: theme.navy,
        }}
      >
        {lines.map((l, i) => {
          const typed = typedTotal - before;
          before += lineLens[i];
          return (
            <div key={i}>
              <Rich text={l} typed={typed} hl={hl} />
            </div>
          );
        })}
      </div>

      {/* subline */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1220,
          textAlign: 'center',
          fontFamily: fonts.khBody,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.6,
          color: theme.grey,
          ...enter(frame, fps, typeEnd + 22, 30),
        }}
      >
        {S.subline}
      </div>
    </AbsoluteFill>
  );
};
