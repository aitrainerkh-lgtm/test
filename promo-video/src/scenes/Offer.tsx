import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {CLAMP, enter, prog, springAt, usd} from '../lib/anim';
import {Highlight, Rich} from '../components/Rich';
import {Center, Logo} from '../components/UI';
import {fonts, theme} from '../theme';

const K = config.course;

export const Offer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const price = springAt(frame, fps, 40, {damping: 11, stiffness: 130});
  const strike = prog(frame, 62, 12);
  const badge = springAt(frame, fps, 74, {damping: 10, stiffness: 90});
  const pulse = 1 + Math.sin(Math.max(0, frame - 130) / 9) * 0.025 * interpolate(frame, [130, 140], [0, 1], CLAMP);

  return (
    <AbsoluteFill>
      <Center top={140}>
        <div style={enter(frame, fps, 2, 30)}>
          <Logo size={150} />
        </div>
        <div style={{marginTop: 34, fontFamily: fonts.khBody, fontWeight: 700, fontSize: 54, lineHeight: 1.6, color: theme.navy, ...enter(frame, fps, 10, 30)}}>
          {K.dateLine}
        </div>
        <div style={{fontFamily: fonts.khBody, fontWeight: 400, fontSize: 36, lineHeight: 1.6, color: theme.grey, ...enter(frame, fps, 16, 30)}}>
          <Rich text={K.timeVenueLine} />
        </div>
        <div
          style={{
            marginTop: 44,
            fontFamily: fonts.khBody,
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1.6,
            color: theme.grey,
            ...enter(frame, fps, 26, 30),
          }}
        >
          {K.priceLabel}
        </div>

        {/* price row */}
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 34, height: 290, alignSelf: 'flex-start', marginLeft: 50}}>
          <div
            style={{
              fontFamily: fonts.en,
              fontWeight: 800,
              fontSize: 280,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: theme.navy,
              opacity: interpolate(frame - 40, [0, 8], [0, 1], CLAMP),
              transform: `translateY(${(1 - price) * 60}px) scale(${0.7 + 0.3 * price})`,
            }}
          >
            <Highlight progress={prog(frame, 54, 18)} height="0.2em" bottom="0.06em">
              {usd(K.price)}
            </Highlight>
          </div>
          {K.oldPrice !== null ? (
            <div
              style={{
                position: 'relative',
                fontFamily: fonts.en,
                fontWeight: 700,
                fontSize: 92,
                color: theme.greyLight,
                ...enter(frame, fps, 52, 30),
              }}
            >
              {usd(K.oldPrice)}
              <div
                style={{
                  position: 'absolute',
                  left: -6,
                  right: -6,
                  top: '52%',
                  height: 8,
                  borderRadius: 4,
                  background: theme.grey,
                  transform: `scaleX(${strike}) rotate(-8deg)`,
                  transformOrigin: 'left',
                }}
              />
            </div>
          ) : null}
        </div>

        <div style={{marginTop: 26, fontFamily: fonts.khBody, fontWeight: 700, fontSize: 34, lineHeight: 1.6, color: theme.navy, ...enter(frame, fps, 96, 30)}}>
          <Rich text={K.socialProof} checkColor="#3FA21A" />
        </div>

        <div
          style={{
            marginTop: 34,
            background: theme.navy,
            color: theme.white,
            borderRadius: 999,
            padding: '22px 64px 26px',
            fontFamily: fonts.khBody,
            fontWeight: 700,
            fontSize: 46,
            lineHeight: 1.5,
            boxShadow: '0 20px 44px rgba(20,36,107,0.32)',
            ...enter(frame, fps, 112, 40),
            scale: String(pulse),
          }}
        >
          <Rich text={K.ctaButton} />
        </div>
      </Center>

      {/* rotating bonus badge */}
      <div
        style={{
          position: 'absolute',
          top: 590,
          right: 22,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: theme.lime,
          boxShadow: '0 22px 46px rgba(139,224,60,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 30,
          color: theme.navy,
          fontFamily: fonts.en,
          opacity: Math.min(1, badge * 2),
          transform: `rotate(${-200 * (1 - badge) + 12}deg) scale(${badge})`,
        }}
      >
        <div style={{position: 'absolute', inset: 10, borderRadius: '50%', border: `3px dashed rgba(20,36,107,0.35)`}} />
        <div style={{fontWeight: 800, fontSize: 30, letterSpacing: '0.16em'}}>{K.bonusTop}</div>
        <div style={{fontWeight: 800, fontSize: 27, lineHeight: 1.15, marginTop: 6}}>{K.bonusText}</div>
      </div>
    </AbsoluteFill>
  );
};
