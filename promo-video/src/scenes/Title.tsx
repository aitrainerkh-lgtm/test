import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {CLAMP, enter, prog, springAt} from '../lib/anim';
import {Rich} from '../components/Rich';
import {Center, Logo} from '../components/UI';
import {fonts, theme} from '../theme';

const S = config.scenes.title;

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const big = springAt(frame, fps, 22, {damping: 12, stiffness: 120});
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);

  return (
    <AbsoluteFill>
      <Center top={170}>
        <div style={enter(frame, fps, 6, 40)}>
          <Logo size={190} />
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: '#E6E9EF',
            borderRadius: 999,
            padding: '12px 30px',
            fontFamily: fonts.en,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: '0.14em',
            color: theme.navy,
            ...enter(frame, fps, 14, 30),
          }}
        >
          <span style={{position: 'relative', width: 18, height: 18}}>
            <span style={{position: 'absolute', inset: 0, borderRadius: '50%', background: theme.lime}} />
            <span
              style={{
                position: 'absolute',
                inset: -8 * pulse,
                borderRadius: '50%',
                border: `3px solid ${theme.lime}`,
                opacity: 1 - pulse,
              }}
            />
          </span>
          {config.course.liveLabel}
        </div>

        <div
          style={{
            fontFamily: fonts.en,
            fontWeight: 800,
            fontSize: 400,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: theme.navy,
            marginTop: 20,
            opacity: interpolate(frame - 22, [0, 10], [0, 1], CLAMP),
            transform: `translateY(${(1 - big) * 80}px) scale(${0.8 + 0.2 * big})`,
          }}
        >
          {S.bigWord}
        </div>

        <div
          style={{
            fontFamily: fonts.en,
            fontWeight: 800,
            fontSize: 112,
            lineHeight: 1.15,
            color: theme.navy,
            letterSpacing: '-0.02em',
            ...enter(frame, fps, 36, 50),
          }}
        >
          <Rich text={S.secondLine} hl={prog(frame, 52, 18)} />
        </div>

        <div
          style={{
            marginTop: 54,
            background: theme.white,
            borderRadius: 999,
            boxShadow: theme.shadowSoft,
            padding: '18px 40px',
            fontFamily: fonts.khBody,
            fontWeight: 700,
            fontSize: 38,
            lineHeight: 1.5,
            color: theme.navy,
            ...enter(frame, fps, 64, 40),
          }}
        >
          {config.course.noCodePill}
        </div>
      </Center>
    </AbsoluteFill>
  );
};
