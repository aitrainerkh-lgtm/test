import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {enter, prog, springAt} from '../lib/anim';
import {Rich} from '../components/Rich';
import {LineIcon} from '../components/Icons';
import {fonts, theme} from '../theme';

const S = config.scenes.moreTools;

export const MoreTools: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: fonts.khHead,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.65,
          color: theme.navy,
          ...enter(frame, fps, 4, 40),
        }}
      >
        <Rich text={S.headline} hl={prog(frame, 20, 18)} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 275,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: fonts.khBody,
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.6,
          color: theme.grey,
          ...enter(frame, fps, 12, 30),
        }}
      >
        {S.subline}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 420,
          left: 70,
          right: 70,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 26,
        }}
      >
        {S.tiles.map((t, i) => {
          const s = springAt(frame, fps, 24 + i * 5, {damping: 12, stiffness: 170});
          return (
            <div
              key={t.label}
              style={{
                position: 'relative',
                height: 218,
                background: theme.white,
                borderRadius: theme.radius,
                boxShadow: theme.shadowSoft,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                opacity: Math.min(1, s * 1.6),
                transform: `scale(${0.5 + 0.5 * s}) translateY(${(1 - s) * 30}px)`,
              }}
            >
              {t.dot ? (
                <div style={{position: 'absolute', top: 18, right: 18, width: 18, height: 18, borderRadius: '50%', background: theme.lime, boxShadow: '0 0 0 6px rgba(139,224,60,0.2)'}} />
              ) : null}
              <div style={{width: 92, height: 92, borderRadius: 22, background: theme.limeSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <LineIcon name={t.icon} size={52} />
              </div>
              <div style={{fontFamily: fonts.en, fontWeight: 700, fontSize: 30, color: theme.navy, textAlign: 'center'}}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
